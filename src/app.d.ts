import type { IStaticMethods } from "preline/dist";

declare global {
  interface Window {
    _;
    Dropzone;

    // Preline UI
    HSStaticMethods: IStaticMethods;
    HSOverlay: any;
  }

  namespace App {
	//
  }
}

export {};