# GUIA DE TESTE - SORY WEB

##  Funções Implementadas

### 1. BUSCA DE IMAGENS (Múltiplas Fontes)
- Wiki Commons (15 imagens)
- NASA (15 imagens espaciais)
- Archive.org (15 imagens históricas)
- Pollinations AI (geração neural, fallback)

**Comandos:**
- /imagem gato
- /img nebulosa
- /image matrix

**Navegação:**
-  Imagem anterior
-  Próxima imagem
- Enter: Fechar galeria

### 2. REDDIT TRENDS
- /reddit brazil
- trends technology
- /reddit popular

### 3. OUTROS
- /livro matrix
- /anime naruto
- /clima são paulo
- /mercado

##  Como Executar

**Opção 1: Python Server**
```
cd 'c:\Users\Kayqu\OneDrive\Área de Trabalho\libsci\sory_Web'
python -m http.server 8000
```
Acesse: http://localhost:8000

**Opção 2: VS Code Live Server**
- Instale extensão 'Live Server'
- Clique direito em index.html  Open with Live Server

##  REMOVIDO
- searchTV (CORS issue, sem alternativa gratuita)
