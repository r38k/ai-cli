import { createStyler } from "./styles.ts";

export class Spinner {
  private frames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
  private currentFrame = 0;
  private intervalId?: number;
  private message: string;
  private isSpinning = false;

  constructor(message: string = "Loading...") {
    this.message = message;
  }

  start(): void {
    if (this.isSpinning) return;

    this.isSpinning = true;
    const styler = createStyler();

    // Hide cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));

    this.intervalId = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      const output = `\r${styler.cyan(frame)} ${this.message}`;

      Deno.stdout.writeSync(new TextEncoder().encode(output));

      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  stop(finalMessage?: string): void {
    if (!this.isSpinning) return;

    this.isSpinning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Clear the line and show cursor
    const clearLine = "\r\x1b[K";
    Deno.stdout.writeSync(new TextEncoder().encode(clearLine));
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));

    if (finalMessage) {
      console.log(finalMessage);
    }
  }

  updateMessage(message: string): void {
    this.message = message;
  }
}

/**
 * 一時的なスピナーを表示
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string,
): Promise<T> {
  const spinner = new Spinner(message);
  spinner.start();

  try {
    const result = await fn();
    const styler = createStyler();
    spinner.stop(
      successMessage ? `${styler.green("✓")} ${successMessage}` : undefined,
    );
    return result;
  } catch (error) {
    const styler = createStyler();
    spinner.stop(
      errorMessage ? `${styler.red("✗")} ${errorMessage}` : undefined,
    );
    throw error;
  }
}
