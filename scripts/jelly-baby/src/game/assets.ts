/** Bound network waits and expose actual download progress without a second request. */
let completed=0;
export async function assetResponse(url:URL) {
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`素材下载失败（${response.status}）：${url.pathname.split('/').pop()}`);
  return response;
}
export function assetComplete(){completed++;document.querySelector('#loading')?.setAttribute('data-assets-loaded',String(completed));}
export async function unpackAsset(url:URL) {
  const response=await assetResponse(url);
  if(!response.body)throw new Error('素材下载内容为空，请重新加载');
  const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  assetComplete();return bytes;
}
