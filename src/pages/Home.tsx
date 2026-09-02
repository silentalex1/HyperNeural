import { useEffect, useRef, useState } from 'react'

function getTarget() {
  const FIVE = 5 * 24 * 60 * 60 * 1000
  const s = localStorage.getItem('inferforge-revamp-target')
  if (s) {
    const v = Number(s)
    if (Date.now() + FIVE - v > 1000) {
      const t = Date.now() + FIVE
      localStorage.setItem('inferforge-revamp-target', String(t))
      return t
    }
    return v
  }
  const t = Date.now() + FIVE
  localStorage.setItem('inferforge-revamp-target', String(t))
  return t
}
function pad(n:number){return String(n).padStart(2,'0')}

export default function Home(){
  const [target]=useState(()=>getTarget())
  const [now,setNow]=useState(()=>Date.now())
  const [mouse,setMouse]=useState({x:-9999,y:-9999})
  const canvasRef=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[])
  useEffect(()=>{
    const h=(e:MouseEvent)=>setMouse({x:e.clientX,y:e.clientY})
    window.addEventListener('mousemove',h)
    return()=>window.removeEventListener('mousemove',h)
  },[])
  useEffect(()=>{
    const c=canvasRef.current
    if(!c) return
    const ctx=c.getContext('2d')
    if(!ctx) return
    let raf=0
    const size=40
    const draw=()=>{
      const dpr=window.devicePixelRatio||1
      const w=window.innerWidth, h=window.innerHeight
      c.width=w*dpr; c.height=h*dpr
      c.style.width=w+'px'; c.style.height=h+'px'
      ctx.setTransform(dpr,0,0,dpr,0,0)
      ctx.clearRect(0,0,w,h)
      const cols=Math.ceil(w/size)+1, rows=Math.ceil(h/size)+1
      for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
          const px=x*size, py=y*size
          const dx=px - mouse.x, dy=py - mouse.y
          const dist=Math.hypot(dx,dy)
          const hover=Math.max(0, 1 - dist/260)
          const pop=hover*hover
          const alpha=0.06 + pop*0.22
          const b=18 + pop*22
          const scale=1 + pop*0.16
          ctx.save()
          ctx.translate(px+size/2, py+size/2)
          ctx.scale(scale,scale)
          ctx.translate(-size/2, -size/2)
          ctx.fillStyle=`rgba(255,255,255,${alpha})`
          ctx.fillRect(1,1,size-2,size-2)
          if(pop>0.12){
            ctx.strokeStyle=`rgba(99,102,241,${0.15+pop*0.35})`
            ctx.lineWidth=1
            ctx.shadowColor=`rgba(99,102,241,${0.4*pop})`
            ctx.shadowBlur=b
            ctx.strokeRect(1.5,1.5,size-3,size-3)
          }
          ctx.restore()
        }
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return()=>cancelAnimationFrame(raf)
  },[mouse])
  const d=Math.max(0,target-now)
  const days=Math.floor(d/(24*60*60*1000))
  const hours=Math.floor(d%(24*60*60*1000)/(60*60*1000))
  const mins=Math.floor(d%(60*60*1000)/(60*1000))
  const secs=Math.floor(d%(60*1000)/1000)
  const Cell=({v,l}:{v:string,l:string})=>(
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl px-7 py-6 min-w-[104px] text-center shadow-[0_8px_32px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)_inset]">
      <div className="text-3xl md:text-[34px] font-extrabold tracking-tight text-white tabular-nums">{v}</div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-white/45 mt-1.5 font-semibold">{l}</div>
    </div>
  )
  return(
    <div className="min-h-[calc(100vh-64px)] bg-[#0e1b3d] text-slate-100 relative overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0" style={{background:`radial-gradient(900px 600px at 50% -10%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(700px 500px at 90% 90%, rgba(251,146,60,0.08), transparent 60%), linear-gradient(180deg, #0e1b3d 0%, #0a1430 100%)`}}/>
      <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:`linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)`,backgroundSize:'40px 40px'}}/>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none"/>
      <div className="pointer-events-none absolute inset-0" style={{background:`radial-gradient(420px 420px at ${mouse.x}px ${mouse.y}px, rgba(99,102,241,0.14), transparent 70%)`}}/>
      <div className="relative w-full max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-400/20 bg-orange-500/10 text-orange-300 text-xs font-medium backdrop-blur">Revamp in progress</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mt-6 drop-shadow-sm">Sorry we are revamping this website and project.</h1>
        <p className="text-white/55 mt-4 text-[15px]">Stay tuned, the countdown timer may not be right.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Cell v={pad(days)} l="Days"/>
          <Cell v={pad(hours)} l="Hours"/>
          <Cell v={pad(mins)} l="Minutes"/>
          <Cell v={pad(secs)} l="Seconds"/>
        </div>
        <p className="text-xs text-white/30 mt-8 tracking-wide">5 day countdown · InferForge will be back shortly</p>
      </div>
    </div>
  )
}
