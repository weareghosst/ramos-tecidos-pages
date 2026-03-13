# 🧵 Ramos Tecidos

E-commerce completo de tecidos desenvolvido do zero com Next.js, TypeScript, TailwindCSS e Supabase.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 📋 Sobre o projeto

O **Ramos Tecidos** é uma plataforma de e-commerce para venda de tecidos, com painel administrativo completo, integração de pagamentos e cálculo de frete em tempo real.

Este projeto foi desenvolvido como projeto pessoal para prática de desenvolvimento full stack com tecnologias modernas.

---

## ✨ Funcionalidades

### Loja
- 🛍️ Catálogo de produtos com busca e filtragem
- 🔍 Busca por nome e tipo de tecido
- 🛒 Carrinho de compras
- 💳 Pagamento via **Pix (Mercado Pago)**
- 🚚 Cálculo de frete em tempo real via **Melhor Envio**
- 📦 Rastreamento de pedidos

### Admin
- 🔐 Autenticação de administrador via Supabase Auth
- 📊 Painel de controle de pedidos
- 📝 Cadastro e edição de produtos
- 📬 Código de rastreamento com notificação automática por e-mail
- 🏷️ Gestão de status dos pedidos (Pago / Pendente / Enviado / Cancelado)

### Notificações
- 📧 E-mail de confirmação de compra via **Resend**
- 📧 E-mail automático com código de rastreamento ao cliente

---

## 🚀 Tecnologias

| Tecnologia | Uso |
|---|---|
| [Next.js](https://nextjs.org/) (Pages Router) | Framework principal |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [TailwindCSS](https://tailwindcss.com/) | Estilização |
| [Supabase](https://supabase.com/) | Banco de dados e autenticação |
| [Mercado Pago](https://www.mercadopago.com.br/) | Pagamento via Pix |
| [Melhor Envio](https://melhorenvio.com.br/) | Cálculo de frete |
| [Resend](https://resend.com/) | Envio de e-mails |
| [Vercel](https://vercel.com/) | Deploy e hospedagem |

---

## 🛠️ Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no Mercado Pago (sandbox)
- Conta no Melhor Envio
- Conta no Resend

### Instalação

```bash
# Clone o repositório
git clone https://github.com/weareghosst/ramos-tecidos-pages.git

# Entre na pasta
cd ramos-tecidos-pages

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

MERCADOPAGO_ACCESS_TOKEN=seu_token_mercadopago

MELHOR_ENVIO_TOKEN=seu_token_melhor_envio

RESEND_API_KEY=sua_api_key_resend
```

### Rodando

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 📁 Estrutura do projeto

```
ramos-tecidos-pages/
├── pages/
│   ├── api/          # Rotas de API (pagamento, frete, e-mail)
│   ├── admin/        # Painel administrativo
│   ├── produtos/     # Catálogo e detalhes de produtos
│   └── index.tsx     # Página inicial
├── components/       # Componentes reutilizáveis
├── lib/              # Configurações (Supabase, etc.)
├── styles/           # Estilos globais
└── types/            # Tipos TypeScript
```

---

## 👨‍💻 Autor

**João Victor Assumpção Cruz**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/joão-victor-assumpção-cruz-2373583b7)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/weareghosst)

---

## 📄 Licença

Este projeto está sob a licença MIT.
