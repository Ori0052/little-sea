/** Optional host adapter. The public website has no dependency on the Toss SDK. */
export interface SeaPlatform {
  rewardAd?:{isReady:()=>boolean;prepare:()=>Promise<void>;show:()=>Promise<boolean>};
  host:'toss';
  apiOrigin:string;
  createGiftLink:(id:string)=>Promise<string>;
  shareMessage:(text:string)=>Promise<void>;
  copyText:(text:string)=>Promise<void>;
  saveImage:(file:File)=>Promise<void>;
}
declare global {var __littleSeaPlatform:SeaPlatform|undefined}
export function seaPlatform(){return globalThis.__littleSeaPlatform}
export function seaApiUrl(path:string){const host=seaPlatform();return host?new URL(path,host.apiOrigin).href:path}
