import { logger } from './logger.js';

/**
 * Redis Circuit Breaker
 *
 * Implementa pattern de circuit breaker para Redis:
 * - CLOSED: Normal operation
 * - OPEN: Redis indisponível/limite excedido - fail fast
 * - HALF_OPEN: Tentando reconectar
 *
 * Isso previne que o backend continue fazendo requisições
 * infinitas quando Redis está com problemas.
 */

enum CircuitState {
  CLOSED = 'CLOSED',     // Normal
  OPEN = 'OPEN',         // Falhou, não tentar
  HALF_OPEN = 'HALF_OPEN' // Testando reconexão
}

class RedisCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  // Configuração
  private readonly FAILURE_THRESHOLD = 5;      // Após 5 falhas, abre circuito
  private readonly SUCCESS_THRESHOLD = 2;      // Após 2 sucessos, fecha circuito
  private readonly TIMEOUT = 60000;            // 1 min para tentar novamente
  private readonly RESET_TIMEOUT = 300000;     // 5 min para reset completo

  /**
   * Verifica se pode executar operação Redis
   */
  canExecute(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Tentar meio-abrir após timeout
      if (Date.now() - this.lastFailureTime > this.TIMEOUT) {
        logger.info('Circuit breaker: Transitioning to HALF_OPEN');
        this.state = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    }

    // HALF_OPEN
    return true;
  }

  /**
   * Registra sucesso de operação
   */
  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.SUCCESS_THRESHOLD) {
        logger.info('Circuit breaker: Transitioning to CLOSED (recovered)');
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Registra falha de operação
   */
  recordFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Detectar erros de limite do Redis
    const isLimitError = error.message.includes('max requests limit exceeded');

    if (isLimitError) {
      logger.error({
        error: error.message,
        state: this.state
      }, '🚨 Redis limit exceeded - opening circuit breaker');

      // Abrir imediatamente no caso de limite excedido
      this.state = CircuitState.OPEN;
      this.failureCount = this.FAILURE_THRESHOLD;
      return;
    }

    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      logger.error({
        failureCount: this.failureCount,
        error: error.message
      }, '🚨 Circuit breaker: Transitioning to OPEN');

      this.state = CircuitState.OPEN;
    }

    // Reset automático após longo período
    if (Date.now() - this.lastFailureTime > this.RESET_TIMEOUT) {
      this.reset();
    }
  }

  /**
   * Reset manual do circuit breaker
   */
  reset(): void {
    logger.info('Circuit breaker: Manual reset to CLOSED');
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Status atual
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      canExecute: this.canExecute()
    };
  }
}

// Instância singleton
export const redisCircuitBreaker = new RedisCircuitBreaker();
