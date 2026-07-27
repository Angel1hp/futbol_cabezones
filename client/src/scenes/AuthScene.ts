import Phaser from 'phaser';
import { DOMOverlay } from '../ui/DOMOverlay';
import { supabase } from '../services/supabase.service';

export class AuthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AuthScene' });
  }

  create() {
    // Background for Auth Scene
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Gradient background using Phaser graphics
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add some floating particles for premium aesthetic
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: { min: height, max: height + 50 },
      lifespan: 4000,
      speedY: { min: -20, max: -60 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      frequency: 200
    });
    // We assume 'particle' is loaded in PreloadScene. If not, it will just not show gracefully.

    DOMOverlay.showAuthModal(
      async (email, password) => {
        // Handle Login
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          console.log('Logged in successfully', data);
          this.finishAuth();
        } catch (err: unknown) {
          alert('Error al iniciar sesión: ' + (err instanceof Error ? err.message : String(err)));
        }
      },
      async (email, password, username) => {
        // Handle Register
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
          });
          if (error) throw error;
          alert('Registro exitoso. ¡Inicia sesión para continuar!');
        } catch (err: unknown) {
          alert('Error al registrarse: ' + (err instanceof Error ? err.message : String(err)));
        }
      },
      () => {
        // Handle Guest
        console.log('Playing as guest');
        this.finishAuth();
      }
    );
  }

  private finishAuth() {
    DOMOverlay.hide();
    this.scene.start('MainMenuScene');
  }
}
