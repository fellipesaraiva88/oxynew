import { supabaseAdmin } from '../../config/supabase.js';
import { openai, AI_MODELS } from '../../config/openai.js';
import { logger } from '../../config/logger.js';

/**
 * Knowledge Base Service
 *
 * Simplified version aligned with actual database schema:
 * - id, organization_id, question, answer, source, learned_from_bipe_id
 * - usage_count, last_used_at, created_at, updated_at
 */

export interface KnowledgeEntry {
  id?: string;
  organization_id: string;
  question: string;
  answer: string;
  source?: 'bipe' | 'manual' | 'import' | null;
  learned_from_bipe_id?: string | null;
  usage_count?: number | null;
  last_used_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateKnowledgeEntryData {
  organization_id: string;
  question: string;
  answer: string;
  source?: 'bipe' | 'manual' | 'import';
  learned_from_bipe_id?: string;
}

export interface UpdateKnowledgeEntryData {
  question?: string;
  answer?: string;
  source?: 'bipe' | 'manual' | 'import';
}

export interface SearchKnowledgeResult {
  id: string;
  question: string;
  answer: string;
  source: string | null;
  usage_count: number | null;
  relevance_score: number;
}

export class KnowledgeBaseService {
  /**
   * Create new knowledge base entry
   */
  async createEntry(data: CreateKnowledgeEntryData): Promise<KnowledgeEntry> {
    const { data: entry, error } = await supabaseAdmin
      .from('knowledge_base')
      .insert({
        organization_id: data.organization_id,
        question: data.question,
        answer: data.answer,
        source: data.source || 'manual',
        learned_from_bipe_id: data.learned_from_bipe_id,
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to create knowledge base entry');
      throw error;
    }

    return entry as KnowledgeEntry;
  }

  /**
   * Get entry by ID
   */
  async getEntryById(id: string, organizationId: string): Promise<KnowledgeEntry | null> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      logger.error({ error, id }, 'Failed to get knowledge base entry');
      return null;
    }

    return data as KnowledgeEntry;
  }

  /**
   * List all entries for organization
   */
  async listEntries(
    organizationId: string,
    filters: { source?: string; limit?: number } = {}
  ): Promise<KnowledgeEntry[]> {
    let query = supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error }, 'Failed to list knowledge base entries');
      throw error;
    }

    return (data || []) as KnowledgeEntry[];
  }

  /**
   * Update entry
   */
  async updateEntry(
    id: string,
    organizationId: string,
    updates: UpdateKnowledgeEntryData
  ): Promise<KnowledgeEntry> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      logger.error({ error, id }, 'Failed to update knowledge base entry');
      throw error;
    }

    return data as KnowledgeEntry;
  }

  /**
   * Delete entry
   */
  async deleteEntry(id: string, organizationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('knowledge_base')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      logger.error({ error, id }, 'Failed to delete knowledge base entry');
      throw error;
    }
  }

  /**
   * Search knowledge base (simple text matching)
   */
  async searchKnowledge(
    query: string,
    organizationId: string,
    limit: number = 5
  ): Promise<SearchKnowledgeResult[]> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      logger.error({ error, query }, 'Failed to search knowledge base');
      return [];
    }

    // Calculate simple relevance score based on position of match
    return (data || []).map(entry => {
      const questionMatch = entry.question.toLowerCase().includes(query.toLowerCase());
      const answerMatch = entry.answer.toLowerCase().includes(query.toLowerCase());

      let relevance_score = 0;
      if (questionMatch) relevance_score += 70;
      if (answerMatch) relevance_score += 30;

      return {
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        source: entry.source,
        usage_count: entry.usage_count,
        relevance_score
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Suggest answer using AI + knowledge base
   */
  async suggestAnswer(question: string, organizationId: string): Promise<{
    answer: string;
    source: 'kb_match' | 'ai_generated';
    confidence: number;
  }> {
    // 1. Search knowledge base first
    const kbResults = await this.searchKnowledge(question, organizationId, 3);

    // 2. High confidence match (>70) - return directly
    if (kbResults.length > 0 && kbResults[0].relevance_score >= 70) {
      await this.incrementUsage(kbResults[0].id);
      return {
        answer: kbResults[0].answer,
        source: 'kb_match',
        confidence: kbResults[0].relevance_score / 100
      };
    }

    // 3. Use AI to generate answer with KB context
    const context = kbResults.map(r =>
      `Q: ${r.question}\nA: ${r.answer}`
    ).join('\n\n');

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODELS.CLIENT,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente que responde perguntas usando a base de conhecimento da empresa.
Base de conhecimento disponível:
${context}

Se a pergunta puder ser respondida com base nessas informações, use-as. Caso contrário, informe que não tem essa informação.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const answer = completion.choices[0].message.content || 'Desculpe, não consegui gerar uma resposta.';

      return {
        answer,
        source: 'ai_generated',
        confidence: kbResults.length > 0 ? 0.6 : 0.3
      };
    } catch (error) {
      logger.error({ error, question }, 'Failed to generate AI answer');
      return {
        answer: 'Desculpe, não consegui processar sua pergunta no momento.',
        source: 'ai_generated',
        confidence: 0
      };
    }
  }

  /**
   * Increment usage count for an entry
   */
  async incrementUsage(entryId: string): Promise<void> {
    // Get current count first
    const { data: entry } = await supabaseAdmin
      .from('knowledge_base')
      .select('usage_count')
      .eq('id', entryId)
      .single();

    const currentCount = entry?.usage_count || 0;

    const { error } = await supabaseAdmin
      .from('knowledge_base')
      .update({
        usage_count: currentCount + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (error) {
      logger.error({ error, entryId }, 'Failed to increment usage count');
    }
  }

  /**
   * Get stats for knowledge base
   */
  async getStats(organizationId: string): Promise<{
    total: number;
    by_source: Record<string, number>;
    most_used: Array<{ question: string; usage_count: number }>;
  }> {
    const { data: entries } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('organization_id', organizationId);

    const total = entries?.length || 0;

    const by_source = (entries || []).reduce((acc, entry) => {
      const source = entry.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const most_used = (entries || [])
      .filter(e => e.usage_count && e.usage_count > 0)
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 5)
      .map(e => ({
        question: e.question,
        usage_count: e.usage_count || 0
      }));

    return { total, by_source, most_used };
  }

  /**
   * LEGACY METHOD - for BIPE compatibility
   */
  async addFromBipe(entry: {
    organizationId: string;
    question: string;
    answer: string;
    bipeId: string;
  }): Promise<void> {
    await this.createEntry({
      organization_id: entry.organizationId,
      question: entry.question,
      answer: entry.answer,
      source: 'bipe',
      learned_from_bipe_id: entry.bipeId
    });
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
