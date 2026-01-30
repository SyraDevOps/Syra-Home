# 🔒 GUIA DE SEGURANÇA - SORY WEB

## ✅ Configuração Segura Implementada

### 1. API Keys Movidas para Config
Todas as chaves de API foram removidas do código-fonte e movidas para:
```
config/api-config.json
config/google-credentials.json
```

### 2. Estrutura de Arquivos

```
sory_Web/
├── config/
│   ├── api-config.json          # ⚠️ NÃO COMMITAR (contém chave real)
│   ├── api-config.example.json  # ✅ Template seguro
│   └── google-credentials.json  # ⚠️ NÃO COMMITAR (service account)
├── js/
│   ├── config-loader.js         # Carrega configurações
│   └── ...
└── .gitignore                   # Protege arquivos sensíveis
```

### 3. Como Funciona

**Carregamento Automático:**
```javascript
// app.js inicializa automaticamente
loadAPIConfig().then(() => {
    console.log('[INIT] API configuration loaded');
});

// cognitive.js usa a função helper
const API_KEY = getAPIKey();
```

**Fallback Seguro:**
Se o arquivo de config não for encontrado, usa fallback hardcoded (apenas para desenvolvimento).

### 4. .gitignore Configurado

Os seguintes arquivos **NÃO** serão commitados:
- `config/api-config.json`
- `config/google-credentials.json`
- `sory_history.json`
- Logs e arquivos temporários

### 5. Configuração para Novos Desenvolvedores

**Passo 1:** Copie o template
```bash
cp config/api-config.example.json config/api-config.json
```

**Passo 2:** Edite `config/api-config.json` e adicione sua chave:
```json
{
  "gemini_api_key": "SUA_CHAVE_AQUI",
  "model": "gemini-2.0-flash-exp",
  "temperature": 0.7,
  "max_tokens": 150
}
```

**Passo 3:** Nunca commite o arquivo real!

### 6. Verificação de Segurança

**Antes de commitar, verifique:**
```bash
git status
```

**Certifique-se que NÃO aparecem:**
- ❌ `config/api-config.json`
- ❌ `config/google-credentials.json`

**Devem aparecer:**
- ✅ `config/api-config.example.json`
- ✅ `.gitignore`

### 7. Boas Práticas

1. **Nunca** compartilhe suas chaves de API
2. **Sempre** use `.gitignore` para arquivos sensíveis
3. **Rotacione** chaves periodicamente
4. **Use** variáveis de ambiente em produção
5. **Monitore** uso de API no console do Google Cloud

### 8. Console Logs

Ao iniciar, você verá:
```
[CONFIG] API configuration loaded successfully
[INIT] API configuration loaded
```

Se houver erro:
```
[CONFIG] Failed to load API config: ...
```

### 9. Produção

Para deploy em produção, considere:
- Usar variáveis de ambiente
- Implementar backend proxy para API calls
- Nunca expor chaves no frontend
- Usar rate limiting
- Implementar autenticação de usuários

---

**Status Atual:** ✅ Configuração segura implementada
**Arquivos Protegidos:** ✅ .gitignore configurado
**Fallback:** ✅ Funciona mesmo sem config (dev only)
