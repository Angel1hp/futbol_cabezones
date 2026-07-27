# ⚽ Fútbol Cabezones Online
¡Un frenético juego de fútbol multijugador 2D en tiempo real para navegador, inspirado en el clásico "Head Soccer"!

## 🌟 Características
- **Multijugador Autoritativo:** Física AABB calculada a 60 FPS en el backend (`Node.js`) previniendo trampas.
- **Interpolación Fluida:** El cliente (`Phaser 3`) interpola y predice el input para una experiencia sin lag.
- **Gráficos Premium:** Diseños de personajes vectoriales, partículas para la pelota, y cámara con impacto visual.
- **Persistencia en la Nube:** Autenticación y registro de resultados utilizando `Supabase`.

## 🏗️ Arquitectura (Monorepo)
- **`@futbol-cabezones/shared`**: Tipos, constantes de configuración y el potente `PhysicsEngine` 100% matemático.
- **`@futbol-cabezones/server`**: Servidor Node.js + Express + Socket.IO. Instancia `GameRoom` para cada partida y orquesta el bucle de juego a 60Hz. Al terminar, la instancia persiste los resultados en Supabase bypasseando el RLS usando su Service Role Key.
- **`@futbol-cabezones/client`**: Frontend HTML5 empacado con Vite. Renderizado por Phaser 3. Contiene la AuthScene, MainMenuScene, CharacterSelectScene, LobbyScene y GameScene.

## 🚀 Despliegue
El proyecto está preparado para Infraestructura como Código:
- **Frontend:** Desplegable en `Vercel` (ver `vercel.json`).
- **Backend:** Desplegable en `Render` o `Railway` (ver `render.yaml`).

## 🛠️ Instalación Local
```bash
git clone https://github.com/tu-usuario/futbol_cabezones.git
cd futbol_cabezones
npm install
npm run dev -w @futbol-cabezones/server
npm run dev -w @futbol-cabezones/client
```
*(No olvides configurar tu archivo `.env` en el servidor y `.env` de vite en el cliente con tus llaves de Supabase)*.
