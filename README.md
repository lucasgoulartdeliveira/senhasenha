# VaultLock

Gerenciador de senhas com duas camadas de proteção, feito com React + Vite.

## Como executar no VS Code

1. Instale o Node.js (versão LTS).
2. Extraia o ZIP e abra a pasta `vaultlock` no VS Code.
3. Abra o terminal do VS Code (`Terminal > Novo Terminal`).
4. Execute:

```bash
npm install
npm run dev
```

5. Abra o endereço local mostrado no terminal (normalmente `http://localhost:5173`).

## Publicar no GitHub e na Vercel

1. Crie um repositório no GitHub.
2. Envie os arquivos desta pasta para o repositório.
3. Na Vercel, escolha **Add New > Project** e importe o repositório.
4. A Vercel detecta Vite automaticamente. Use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Clique em Deploy.

## Como funciona

- Na primeira abertura, crie uma senha principal.
- Depois, entre no cofre e clique em **Nova senha**.
- Cada cadastro tem nome, usuário, senha guardada e uma segunda senha.
- A senha guardada só é revelada após informar a segunda senha.

## Aviso importante de segurança

Este é um projeto demonstrativo/educacional, não um gerenciador de senhas profissional. Os dados criptografados ficam no armazenamento local do navegador (`localStorage`), não há sincronização nem recuperação de senha. Se esquecer a senha principal, os dados não poderão ser recuperados. Se limpar os dados do navegador, poderá perder o cofre. Não use para guardar senhas reais ou informações importantes sem uma auditoria de segurança independente.

A criptografia usa Web Crypto API (AES-GCM e PBKDF2). Publique sempre em HTTPS (a Vercel fornece HTTPS).
