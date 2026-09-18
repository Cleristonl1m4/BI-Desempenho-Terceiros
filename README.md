# Dashboard de Indicadores de Capacidade

Aplicação unificada de indicadores de beneficiadores. O frontend é React/TypeScript/Vite e o backend é FastAPI/Python. Em produção e no modo `dev`, o FastAPI serve a API e os arquivos compilados do frontend na mesma porta.

## Pré-requisitos

- Node.js 18 ou superior e npm
- Python 3.10 ou superior
- Microsoft ODBC Driver 17 for SQL Server
- Acesso ao banco SQL Server configurado no `.env`

## Configuração

Na raiz, crie `.env` com as configurações do backend:

```env
APP_NAME=BI Desempenho Terceiros
DEBUG=false
DATABASE_URL=mssql+pyodbc://usuario:senha@servidor/banco?driver=ODBC+Driver+17+for+SQL+Server
```

Opcionalmente, `VITE_API_URL` pode ser usado para apontar para outro prefixo ou servidor durante o build. Por padrão, o frontend usa `/api`, a mesma origem da aplicação.

## Instalação

```powershell
npm install
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
```

## Execução unificada

```powershell
npm run dev
```

O comando compila o frontend e inicia o FastAPI em `http://localhost:5017`. A mesma porta fornece:

- `GET /api/health`
- `GET /api/beneficiadores/indicadores`
- frontend em `/` e nas rotas da SPA

O modo `dev` usa `--reload` para o backend. Depois de alterações no frontend, execute novamente o comando para gerar um novo `dist/`.

## Produção

```powershell
npm run build
npm start
```

O build fica em `dist/` e é servido pelo FastAPI. Não é necessário iniciar Vite ou outro servidor separado.

## Validação

```powershell
npm run lint
npm run typecheck
pytest -q backend\tests
```

Com a aplicação em execução:

```powershell
curl http://localhost:5017/api/health
curl http://localhost:5017/api/beneficiadores/indicadores
```

## Estrutura

- `src/`: frontend React
- `backend/app/`: API FastAPI, serviços, cache e acesso ao banco
- `backend/tests/`: testes da API e dos serviços
- `dist/`: frontend compilado e servido pelo backend
