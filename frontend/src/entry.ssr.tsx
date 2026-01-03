/*
 * WHAT IS THIS FILE?
 *
 * SSR entry point, in all cases it is the rendered page.
 */
import { renderToStream, type RenderToStreamOptions } from "@builder.io/qwik/server";
import { manifest } from "@qwik-client-manifest";
import Root from "./root";

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    containerAttributes: {
      lang: "en",
      ...opts.containerAttributes,
    },
    serverData: {
      ...opts.serverData,
    },
  });
}
