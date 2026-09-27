# Catálogo Digital MVP

MVP mobile-first para pequenos negócios em Angola.

## Fluxo funcional
- Login por telefone em modo local de teste
- Criação do catálogo
- Template por tipo de negócio
- Capa/logo
- Produtos com foto, preço, promoção, descrição e disponibilidade
- Editar, apagar, duplicar e ordenar produtos
- Destaques/anúncios com foto e data de fim
- Catálogo público por slug
- WhatsApp geral e por produto
- Registo de visitas e cliques WhatsApp
- Estatísticas simples dos últimos 7 dias
- Partilha e cópia do link
- Persistência local para teste imediato
- Interface mobile-first e leve

## Executar
npm install
npm run dev

## Produção
O MVP está funcional localmente. O login OTP real e persistência multi-utilizador exigem backend/serviço de autenticação e base de dados. A camada de UI e os fluxos estão preparados para essa substituição sem depender de localStorage.

## Princípios
Sem pagamentos, stock quantitativo, chat interno, múltiplos utilizadores, app nativa ou editor de sites complexo no MVP.