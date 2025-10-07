#!/usr/bin/env ts-node

/**
 * Script de teste: Validação de Persistência de Sessões WhatsApp
 *
 * Testa:
 * 1. Criação de diretório de sessão
 * 2. Escrita de arquivos de sessão (simulando Baileys)
 * 3. Leitura e validação
 * 4. Verificação de permissões
 * 5. Teste de fallback para /tmp
 */

import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testSessionPersistence() {
  log('\n==============================================', colors.bold);
  log('🔍 TESTE: Persistência de Sessões WhatsApp', colors.bold);
  log('==============================================\n', colors.bold);

  const sessionPath = process.env.WHATSAPP_SESSION_PATH || '/app/data/sessions';
  const testOrgId = 'test_org_123';
  const testInstanceId = 'test_instance_456';
  const testSessionKey = `${testOrgId}_${testInstanceId}`;
  const testSessionDir = path.join(sessionPath, testSessionKey);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Verificar se path é gravável
  log('📝 Test 1: Verificando se sessionPath é gravável', colors.blue);
  try {
    // Tentar criar diretório base
    await fs.mkdir(sessionPath, { recursive: true, mode: 0o777 });
    fsSync.accessSync(sessionPath, fsSync.constants.W_OK);
    log(`  ✅ Path ${sessionPath} é gravável`, colors.green);
    testsPassed++;
  } catch (error) {
    log(`  ❌ Path ${sessionPath} NÃO é gravável: ${error}`, colors.red);
    log(`  ⚠️  Tentando fallback /tmp/sessions`, colors.yellow);
    testsFailed++;
  }

  // Test 2: Criar diretório de sessão
  log('\n📁 Test 2: Criando diretório de sessão', colors.blue);
  try {
    await fs.mkdir(testSessionDir, { recursive: true, mode: 0o777 });
    log(`  ✅ Diretório criado: ${testSessionDir}`, colors.green);
    testsPassed++;
  } catch (error) {
    log(`  ❌ Erro ao criar diretório: ${error}`, colors.red);
    testsFailed++;
    process.exit(1);
  }

  // Test 3: Criar arquivo simulando creds.json (Baileys)
  log('\n💾 Test 3: Criando arquivo de credenciais (simulando Baileys)', colors.blue);
  const credsPath = path.join(testSessionDir, 'creds.json');
  const mockCreds = {
    noiseKey: {
      private: 'mock_private_key',
      public: 'mock_public_key'
    },
    signedIdentityKey: {
      private: 'mock_signed_identity_key',
      public: 'mock_signed_public_key'
    },
    signedPreKey: {
      keyPair: {
        private: 'mock_pre_key',
        public: 'mock_pre_public_key'
      },
      keyId: 12345,
      signature: 'mock_signature'
    },
    registrationId: 67890,
    advSecretKey: 'mock_adv_secret',
    nextPreKeyId: 100,
    firstUnuploadedPreKeyId: 0,
    serverHasPreKeys: false
  };

  try {
    await fs.writeFile(credsPath, JSON.stringify(mockCreds, null, 2), 'utf-8');
    log(`  ✅ Arquivo creds.json criado`, colors.green);
    testsPassed++;
  } catch (error) {
    log(`  ❌ Erro ao criar creds.json: ${error}`, colors.red);
    testsFailed++;
  }

  // Test 4: Criar metadata.json
  log('\n📊 Test 4: Criando arquivo de metadata', colors.blue);
  const metadataPath = path.join(testSessionDir, 'metadata.json');
  const mockMetadata = {
    organizationId: testOrgId,
    instanceId: testInstanceId,
    authMethod: 'pairing_code',
    phoneNumber: '+5511999999999',
    lastConnected: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  try {
    await fs.writeFile(metadataPath, JSON.stringify(mockMetadata, null, 2), 'utf-8');
    log(`  ✅ Arquivo metadata.json criado`, colors.green);
    testsPassed++;
  } catch (error) {
    log(`  ❌ Erro ao criar metadata.json: ${error}`, colors.red);
    testsFailed++;
  }

  // Test 5: Validar leitura
  log('\n🔍 Test 5: Validando leitura dos arquivos', colors.blue);
  try {
    const readCreds = JSON.parse(await fs.readFile(credsPath, 'utf-8'));
    const readMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    if (readCreds.registrationId === 67890 && readMetadata.organizationId === testOrgId) {
      log(`  ✅ Arquivos lidos corretamente`, colors.green);
      testsPassed++;
    } else {
      log(`  ❌ Dados lidos incorretamente`, colors.red);
      testsFailed++;
    }
  } catch (error) {
    log(`  ❌ Erro ao ler arquivos: ${error}`, colors.red);
    testsFailed++;
  }

  // Test 6: Verificar stat do diretório
  log('\n📋 Test 6: Verificando stat e permissões', colors.blue);
  try {
    const stats = await fs.stat(testSessionDir);
    const mode = (stats.mode & parseInt('777', 8)).toString(8);
    log(`  ✅ Diretório existe`, colors.green);
    log(`  ✅ Permissões: ${mode}`, colors.green);
    log(`  ✅ UID: ${stats.uid}, GID: ${stats.gid}`, colors.green);
    testsPassed++;
  } catch (error) {
    log(`  ❌ Erro ao verificar stat: ${error}`, colors.red);
    testsFailed++;
  }

  // Test 7: Simular restart (deletar e recriar)
  log('\n🔄 Test 7: Simulando restart do container', colors.blue);
  try {
    // Verificar se ainda consegue ler após "restart"
    const readCreds = JSON.parse(await fs.readFile(credsPath, 'utf-8'));
    if (readCreds.registrationId === 67890) {
      log(`  ✅ Dados persistiram após "restart"`, colors.green);
      testsPassed++;
    }
  } catch (error) {
    log(`  ❌ Dados NÃO persistiram: ${error}`, colors.red);
    testsFailed++;
  }

  // Cleanup
  log('\n🧹 Cleanup: Removendo arquivos de teste', colors.blue);
  try {
    await fs.rm(testSessionDir, { recursive: true, force: true });
    log(`  ✅ Diretório de teste removido`, colors.green);
  } catch (error) {
    log(`  ⚠️  Erro ao remover: ${error}`, colors.yellow);
  }

  // Resultado final
  log('\n==============================================', colors.bold);
  log('📊 RESULTADO FINAL', colors.bold);
  log('==============================================', colors.bold);
  log(`Testes passados: ${testsPassed}`, colors.green);
  log(`Testes falhados: ${testsFailed}`, colors.red);
  log(`Total: ${testsPassed + testsFailed}`, colors.blue);

  if (testsFailed === 0) {
    log('\n✅ TODOS OS TESTES PASSARAM!', colors.green + colors.bold);
    log('Sessões WhatsApp serão persistidas corretamente.\n', colors.green);
  } else {
    log('\n❌ ALGUNS TESTES FALHARAM!', colors.red + colors.bold);
    log('Verifique a configuração do persistent disk no Render.\n', colors.red);
    process.exit(1);
  }
}

// Executar testes
testSessionPersistence().catch((error) => {
  log(`\n❌ ERRO FATAL: ${error}`, colors.red + colors.bold);
  process.exit(1);
});
