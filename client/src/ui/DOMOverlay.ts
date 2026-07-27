export class DOMOverlay {
  private static getContainer(): HTMLElement {
    let container = document.getElementById('ui-layer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ui-layer';
      document.getElementById('game-container')?.appendChild(container);
    }
    return container;
  }

  public static showAuthModal(
    onLogin: (email: string, pass: string) => void,
    onRegister: (email: string, pass: string, username: string) => void,
    onGuest: () => void
  ) {
    const container = this.getContainer();
    container.style.pointerEvents = 'auto';
    container.innerHTML = `
      <style>
        .auth-overlay {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: rgba(10, 10, 25, 0.85);
          backdrop-filter: blur(12px);
          font-family: 'Inter', sans-serif;
          animation: fadeIn 0.3s ease-out;
        }
        .auth-box {
          background: linear-gradient(135deg, rgba(30, 30, 60, 0.9), rgba(18, 18, 38, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 255, 136, 0.15);
          border-radius: 20px;
          padding: 35px;
          width: 380px;
          text-align: center;
          color: #fff;
        }
        .auth-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(90deg, #00ff88, #00d2ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-subtitle {
          font-size: 14px;
          color: #a0a0c0;
          margin-bottom: 25px;
        }
        .auth-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .auth-tab {
          flex: 1;
          padding: 10px;
          cursor: pointer;
          font-weight: 600;
          color: #707090;
          transition: all 0.2s;
        }
        .auth-tab.active {
          color: #00ff88;
          border-bottom: 2px solid #00ff88;
        }
        .input-group {
          margin-bottom: 16px;
          text-align: left;
        }
        .input-group label {
          display: block;
          font-size: 12px;
          color: #b0b0d0;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .input-group input {
          width: 100%;
          padding: 12px 14px;
          box-sizing: border-box;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-group input:focus {
          border-color: #00ff88;
        }
        .btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s;
        }
        .btn-primary {
          background: linear-gradient(90deg, #00ff88, #00b8ff);
          color: #0d0d1a;
          box-shadow: 0 6px 20px rgba(0, 255, 136, 0.3);
          margin-top: 10px;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
        }
        .btn-guest {
          background: transparent;
          color: #a0a0c0;
          margin-top: 15px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .btn-guest:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
      <div class="auth-overlay">
        <div class="auth-box">
          <div class="auth-title">HEAD SOCCER</div>
          <div class="auth-subtitle">Liga Multijugador Online</div>
          <div class="auth-tabs">
            <div class="auth-tab active" id="tab-login">Iniciar Sesión</div>
            <div class="auth-tab" id="tab-register">Registrarse</div>
          </div>
          <form id="auth-form" onsubmit="return false;">
            <div class="input-group" id="group-username" style="display: none;">
              <label for="input-username">Nombre de Jugador</label>
              <input type="text" id="input-username" placeholder="Ej: CabezonPro">
            </div>
            <div class="input-group">
              <label for="input-email">Correo Electrónico</label>
              <input type="email" id="input-email" placeholder="jugador@ejemplo.com" required>
            </div>
            <div class="input-group">
              <label for="input-password">Contraseña</label>
              <input type="password" id="input-password" placeholder="••••••••" required>
            </div>
            <button class="btn btn-primary" id="btn-submit">ENTRAR</button>
          </form>
          <button class="btn btn-guest" id="btn-guest">Jugar como Invitado</button>
        </div>
      </div>
    `;

    let isLogin = true;
    const tabLogin = document.getElementById('tab-login')!;
    const tabRegister = document.getElementById('tab-register')!;
    const groupUsername = document.getElementById('group-username')!;
    const btnSubmit = document.getElementById('btn-submit')!;

    tabLogin.addEventListener('click', () => {
      isLogin = true;
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      groupUsername.style.display = 'none';
      btnSubmit.textContent = 'ENTRAR';
    });

    tabRegister.addEventListener('click', () => {
      isLogin = false;
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      groupUsername.style.display = 'block';
      btnSubmit.textContent = 'CREAR CUENTA';
    });

    document.getElementById('auth-form')!.addEventListener('submit', () => {
      const email = (document.getElementById('input-email') as HTMLInputElement).value;
      const password = (document.getElementById('input-password') as HTMLInputElement).value;
      if (isLogin) {
        onLogin(email, password);
      } else {
        const username = (document.getElementById('input-username') as HTMLInputElement).value || 'Cabezon_' + Math.floor(Math.random()*1000);
        onRegister(email, password, username);
      }
    });

    document.getElementById('btn-guest')!.addEventListener('click', () => {
      onGuest();
    });
  }

  public static hide() {
    const container = document.getElementById('ui-layer');
    if (container) {
      container.innerHTML = '';
      container.style.pointerEvents = 'none';
    }
  }
}
