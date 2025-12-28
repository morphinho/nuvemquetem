# Guia de Configuração do Git

## 1. Configurar o Git (apenas primeira vez)

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Ou apenas para este repositório:

```powershell
cd C:\Users\oeman\Documents\PROJETOS\nanu\project
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

## 2. Fazer o primeiro commit

```powershell
cd C:\Users\oeman\Documents\PROJETOS\nanu\project
git add .
git commit -m "Initial commit: Funnel de empréstimo com integração Genesys PIX"
```

## 3. Criar repositório no GitHub/GitLab

1. Acesse https://github.com (ou GitLab/Bitbucket)
2. Clique em "New repository"
3. Escolha um nome para o repositório
4. **NÃO** inicialize com README, .gitignore ou licença (já temos isso)
5. Clique em "Create repository"

## 4. Conectar ao repositório remoto

Após criar o repositório, você verá instruções. Execute:

```powershell
cd C:\Users\oeman\Documents\PROJETOS\nanu\project
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git branch -M main
git push -u origin main
```

## 5. Para fazer deploy na Vercel

### Opção A: Via GitHub (recomendado)
1. Conecte seu repositório GitHub à Vercel
2. A Vercel detectará automaticamente o Vite
3. Configure as variáveis de ambiente na Vercel:
   - `VITE_GENESYS_API_SECRET`
   - `VITE_GENESYS_API_URL` (opcional, padrão: https://api.genesys.finance)
   - `VITE_SUPABASE_URL` (se usar)
   - `VITE_SUPABASE_ANON_KEY` (se usar)

### Opção B: Via Vercel CLI
```powershell
npm install -g vercel
cd C:\Users\oeman\Documents\PROJETOS\nanu\project
vercel
```

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env` localmente (já está no .gitignore):

```env
VITE_GENESYS_API_SECRET=sua-chave-aqui
VITE_GENESYS_API_URL=https://api.genesys.finance
```

Na Vercel, adicione essas variáveis nas configurações do projeto.

