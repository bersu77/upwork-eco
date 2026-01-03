/*
 * WHAT IS THIS FILE?
 *
 * Development entry point using Vite's development server.
 */
import { render, type RenderOptions } from "@builder.io/qwik";
import Root from "./root";

export default function (opts: RenderOptions) {
  return render(document, <Root />, opts);
}
