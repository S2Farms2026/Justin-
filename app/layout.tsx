import type {Metadata,Viewport} from "next";import "./globals.css";
export const metadata:Metadata={title:"NEXTASX",description:"Shared task management for hands-on teams.",manifest:"/manifest.webmanifest",applicationName:"NEXTASX",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"NEXTASX"},icons:{icon:[{url:"/nextasx-icon-192.svg",sizes:"192x192",type:"image/svg+xml"},{url:"/nextasx-icon-512.svg",sizes:"512x512",type:"image/svg+xml"}],apple:"/nextasx-icon-192.svg"}};
export const viewport:Viewport={themeColor:"#173d2b"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
