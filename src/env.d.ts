/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user: {
      id: number;
      email: string;
      name: string;
      created_at: string;
    } | null;
  }
}
