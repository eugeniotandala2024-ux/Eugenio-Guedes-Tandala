import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{Plus,Package,Star,Settings,ExternalLink,Trash2,Pencil,MessageCircle,Eye,Copy,Store,ImagePlus,Search,GripVertical,BarChart3,Share2,Check,LogOut,Undo2,Clock,MapPin}from"lucide-react";

type Product={id:string;name:string;price:number;promo?:number;description:string;image?:string;available:boolean;clicks:number;order:number;category?:string};
type Highlight={id:string;text:string;image?:string;active:boolean;endsAt?:string};
type Business={name:string;slug:string;phone:string;description:string;cover?:string;hours:string;location:string;template:string};
type Event={date:string;type:"visit"|"whatsapp";productId?:string};
type Data={business:Business;products:Product[];highlights:Highlight[];events:Event[];loggedIn:boolean};
const KEY="catalogo-digital-v2";
const demoProducts:Product[]=[
{id:"demo-1",name:"Bolo de Chocolate",price:8500,promo:7500,description:"Bolo húmido de chocolate, preparado por encomenda e ideal para aniversários e momentos especiais.",available:true,clicks:12,order:0,category:"Bolos"},
{id:"demo-2",name:"Bolo de Baunilha",price:7000,description:"Bolo leve de baunilha com acabamento simples e caseiro. Encomendas com antecedência.",available:true,clicks:8,order:1,category:"Bolos"},
{id:"demo-3",name:"Sumo Natural de Maracujá",price:2500,description:"Sumo natural de maracujá servido fresco, sem complicação.",available:true,clicks:5,order:2,category:"Bebidas"},
{id:"demo-4",name:"Mini Salgados",price:6000,promo:5500,description:"Selecção de mini salgados para festas, reuniões e pequenas encomendas.",available:true,clicks:17,order:3,category:"Salgados"},
{id:"demo-5",name:"Caixa Especial",price:15000,description:"Combinação de bolo e salgados para oferecer ou partilhar em família.",available:false,clicks:4,order:4,category:"Kits"}
];
const demoHighlights:Highlight[]=[
{id:"h1",text:"Encomendas abertas para esta semana",active:true},
{id:"h2",text:"10% de desconto em encomendas seleccionadas",active:true}
];
const fresh=():Data=>({business:{name:"Casa Doce Luanda",slug:"casa-doce-luanda",phone:"929138244",description:"Bolos caseiros, salgados e bebidas preparados por encomenda em Luanda. Produtos simples, frescos e feitos para partilhar.",hours:"Segunda a Sábado, 08h00 às 18h00",location:"Luanda, Angola",template:"Bolos"},products:demoProducts,highlights:demoHighlights,events:[],loggedIn:false});
function load():Data{try{const x=JSON.parse(localStorage.getItem(KEY)||"null");return x?{...fresh(),...x}:fresh()}catch{return fresh()}}
const money=(n:number)=>new Intl.NumberFormat("pt-AO",{maximumFractionDigits:0}).format(Math.max(0,n))+" Kz";
const slugify=(v:string)=>v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60);
const cleanPhone=(v:string)=>{const d=v.replace(/\D/g,"");return d.startsWith("244")?d:"244"+d};
const wa=(phone:string,msg:string)=>"https://wa.me/"+cleanPhone(phone)+"?text="+encodeURIComponent(msg);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const COMPRESSIONS={leve:{max:800,quality:.60,label:"Leve"},equilibrada:{max:1200,quality:.78,label:"Equilibrada"},alta:{max:1600,quality:.88,label:"Alta qualidade"}} as const;
type CompressionKey=keyof typeof COMPRESSIONS;
const fileToData=(f:File,mode:CompressionKey="equilibrada")=>new Promise<string>((resolve,reject)=>{
 const r=new FileReader();
 r.onerror=reject;
 r.onload=()=>{
  const img=new Image();
  img.onload=()=>{
   const {max,quality}=COMPRESSIONS[mode], scale=Math.min(1,max/Math.max(img.width,img.height));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
   const ctx=canvas.getContext("2d");if(!ctx)return reject(new Error("Não foi possível processar a imagem"));
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   canvas.toBlob(blob=>{if(!blob)return reject(new Error("Não foi possível comprimir a imagem"));const rr=new FileReader();rr.onload=()=>resolve(String(rr.result));rr.onerror=reject;rr.readAsDataURL(blob)},"image/webp",quality);
  };
  img.onerror=()=>reject(new Error("Imagem inválida"));img.src=String(r.result);
 };
 r.readAsDataURL(f);
});
const copyText=async(text:string)=>{try{await navigator.clipboard?.writeText(text);return true}catch{return false}};
const shareCatalog=async(name:string,slug:string)=>{const url=location.origin+"/catalog/"+slug;if(navigator.share){try{await navigator.share({title:name||"Catálogo Digital",url});return "partilhado"}catch{return "cancelado"}}return (await copyText(url))?"copiado":"erro"};
const isLive=(h:Highlight)=>h.active&&(!h.endsAt||h.endsAt>=today());

class AppErrorBoundary extends React.Component<{children:React.ReactNode},{hasError:boolean}>{
 state={hasError:false};
 static getDerivedStateFromError(){return {hasError:true}};
 render(){return this.state.hasError?<main className="errorPage"><div><Store/><h1>O catálogo encontrou um erro</h1><p>Recarrega a página. Se o problema continuar, limpa os dados locais e volta a entrar.</p><button onClick={()=>{try{localStorage.removeItem(KEY)}catch{} location.reload()}}>Reiniciar catálogo</button></div></main>:this.props.children}
}

export default function App(){
 return <AppErrorBoundary><AppInner/></AppErrorBoundary>;
}

function AppInner(){
 const[d,setD]=useState<Data>(load);const dataRef=useRef(d);const[path,setPath]=useState(location.pathname);const[toast,setToast]=useState("");const[undo,setUndo]=useState<Data|null>(null);
 useEffect(()=>{dataRef.current=d;try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}},[d]);
 useEffect(()=>{const onStorage=(e:StorageEvent)=>{if(e.key!==KEY||!e.newValue)return;try{const next=JSON.parse(e.newValue);dataRef.current=next;setD({...fresh(),...next})}catch{}};addEventListener("storage",onStorage);return()=>removeEventListener("storage",onStorage)},[]);
 useEffect(()=>{const f=()=>setPath(location.pathname);addEventListener("popstate",f);return()=>removeEventListener("popstate",f)},[]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(t)}},[toast]);
 const go=(p:string)=>{history.pushState({}, "",p);setPath(p)};
 const update=useCallback((fn:(x:Data)=>Data,msg?:string)=>{const prev=dataRef.current;const next=fn(prev);dataRef.current=next;setUndo(prev);setD(next);if(msg)setToast(msg)},[]);
 const restore=useCallback(()=>{if(!undo)return;dataRef.current=undo;setD(undo);setUndo(null);setToast("Alteração desfeita")},[undo]);
 if(path.startsWith("/catalog/"))return <Public d={d} update={update}/>;
 if(!d.loggedIn&&path!=="/login")return <Login d={d} update={update} go={go}/>;
 if(path==="/login")return <Login d={d} update={update} go={go}/>;
 if(path==="/criar")return <Create d={d} update={update} go={go}/>;
 return <AppErrorBoundary><Dashboard d={d} update={update} go={go} toast={toast} undo={undo} restore={restore}/></AppErrorBoundary>;
}

function Login({d,update,go}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void;go:(p:string)=>void}){
 const[p,setP]=useState("");const[code,setCode]=useState("");const[sent,setSent]=useState(false);
 const send=()=>{if(p.trim())setSent(true)};
 const enter=()=>{if(!code.trim())return;update(x=>({...x,loggedIn:true}));go(d.business.name?"/dashboard":"/criar")};
 return <main className="auth"><div className="authbox"><div className="brand"><Store/>Catálogo Digital</div><h1>{sent?"Confirmar código":"Entrar"}</h1><p>{sent?"Digite qualquer código para testar o MVP.":"Entra com o número de telefone do teu negócio."}</p>{!sent?<><input inputMode="tel" value={p} onChange={e=>setP(e.target.value)} placeholder="923 000 000"/><button disabled={!p.trim()} onClick={send}>Enviar código</button></>:<><input inputMode="numeric" value={code} onChange={e=>setCode(e.target.value)} placeholder="Qualquer código"/><button disabled={!code.trim()} onClick={enter}>Confirmar e entrar</button><button className="secondary" onClick={()=>setSent(false)}>Alterar número</button></>}<small>Modo demonstração: não existe SMS real. Neste MVP, qualquer código preenchido permite entrar e testar todas as funcionalidades.</small></div></main>
}

function Create({d,update,go}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void;go:(p:string)=>void}){
 const[step,setStep]=useState(1);
 const[b,setB]=useState({...d.business});
 const[compression,setCompression]=useState<CompressionKey>("equilibrada");
 const[first,setFirst]=useState({name:"",price:"",promo:"",description:"",available:true,category:"",image:""});
 const[busy,setBusy]=useState(false);
 const types=["Loja","Restaurante","Serviços","Agricultura","Beleza","Moda","Tecnologia","Mercearia","Outro"];
 const save=()=>{
  if(!b.name.trim()||!b.phone.trim())return;
  const slug=slugify(b.slug||b.name);
  const productName=first.name.trim();
  const product=productName&&Number(first.price)>0?{id:crypto.randomUUID(),name:productName,price:Number(first.price),promo:first.promo?Number(first.promo):undefined,description:first.description.trim(),available:first.available,clicks:0,order:0,category:first.category.trim()||undefined,image:first.image||undefined}:null;
  update(x=>({...x,business:{...b,slug,cover:b.cover},products:product?[...x.products,product]:x.products,loggedIn:true}),product?"Catálogo criado com primeiro produto":"Catálogo criado");
  go("/dashboard");
 };
 const next=()=>{if(step===1&&!b.template)return;if(step===2&&(!b.name.trim()||!b.phone.trim()))return;setStep(Math.min(3,step+1))};
 const back=()=>setStep(Math.max(1,step-1));
 return <main className="auth onboarding"><div className="formbox wide onboardingBox">
  <div className="onboardingTop"><div><div className="brand"><Store/>Catálogo Digital</div><p>Vamos montar o teu catálogo em poucos passos.</p></div><span>Passo {step} de 3</span></div>
  <div className="stepper"><span className={step>=1?"done":""}>1</span><i/><span className={step>=2?"done":""}>2</span><i/><span className={step>=3?"done":""}>3</span></div>
  {step===1&&<section className="onboardingStep"><h1>Que tipo de negócio tens?</h1><p>Escolhe o mais próximo. Isto só ajuda a organizar o catálogo.</p><div className="typeGrid">{types.map(t=><button key={t} className={b.template===t?"selected":""} onClick={()=>setB({...b,template:t})}>{t}</button>)}</div></section>}
  {step===2&&<section className="onboardingStep"><h1>Vamos identificar o negócio</h1><p>Só o essencial agora. O resto pode ser alterado depois.</p>
   <label>Nome do negócio<input autoFocus value={b.name} onChange={e=>setB({...b,name:e.target.value})} placeholder="Ex.: Mercearia do Bairro"/></label>
   <label>WhatsApp<input inputMode="tel" value={b.phone} onChange={e=>setB({...b,phone:e.target.value})} placeholder="923 000 000"/></label>
   <label>Descrição curta<textarea maxLength={220} value={b.description} onChange={e=>setB({...b,description:e.target.value})} placeholder="O que vendes ou fazes?"/></label>
   <label>Foto de capa / logo<div className="upload small">{b.cover?<img src={b.cover} alt="Capa do negócio"/>:<><ImagePlus/><span>Escolher foto</span></>}<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{setB({...b,cover:await fileToData(file,compression)})}catch{}}}/></div></label>
   <select value={compression} onChange={e=>setCompression(e.target.value as CompressionKey)}><option value="leve">Leve — mais pequena</option><option value="equilibrada">Equilibrada — recomendada</option><option value="alta">Alta qualidade — maior</option></select>
  </section>}
  {step===3&&<section className="onboardingStep"><h1>Adicionar o primeiro produto</h1><p>Opcional. Podes começar com um produto ou serviço e adicionar os restantes depois.</p>
   <label>Nome<input autoFocus value={first.name} onChange={e=>setFirst({...first,name:e.target.value})} placeholder="Ex.: Bolo de chocolate"/></label>
   <div className="twocol"><label>Preço (Kz)<input type="number" min="1" value={first.price} onChange={e=>setFirst({...first,price:e.target.value})} placeholder="5000"/></label><label>Promoção (Kz)<input type="number" min="1" value={first.promo} onChange={e=>setFirst({...first,promo:e.target.value})} placeholder="4500"/></label></div>
   <label>Categoria <input value={first.category} onChange={e=>setFirst({...first,category:e.target.value})} placeholder="Ex.: Bolos, Bebidas, Serviços"/></label>
   <label>Descrição curta<textarea maxLength={160} value={first.description} onChange={e=>setFirst({...first,description:e.target.value})}/></label>
   <label>Foto<div className="upload small">{first.image?<img src={first.image} alt={first.name||"Produto"}/>:<><ImagePlus/><span>Escolher foto</span></>}<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);try{setFirst({...first,image:await fileToData(file,compression)})}catch{}finally{setBusy(false)}}}/></div></label>
   <label className="check"><input type="checkbox" checked={first.available} onChange={e=>setFirst({...first,available:e.target.checked})}/> Disponível</label>
   <p className="skipNote">Sem produto agora? Continua e adiciona depois no painel.</p>
  </section>}
  <div className="onboardingActions">{step>1?<button className="secondary" onClick={back}>Voltar</button>:<span/>}{step<3?<button disabled={(step===1&&!b.template)||(step===2&&(!b.name.trim()||!b.phone.trim()))} onClick={next}>Continuar</button>:<button disabled={busy||!b.name.trim()||!b.phone.trim()} onClick={save}>{busy?"A carregar…":"Criar catálogo"}</button>}</div>
 </div></main>
}
function Dashboard({d,update,go,toast,undo,restore}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void;go:(p:string)=>void;toast:string;undo:Data|null;restore:()=>void}){
 const section=location.pathname.includes("/produtos")?"produtos":location.pathname.includes("/destaques")?"destaques":location.pathname.includes("/estatisticas")?"estatisticas":location.pathname.includes("/definicoes")?"definicoes":"inicio";
 const nav=(p:string)=>go(p);
 return <div className="app"><header><div className="brand"><Store/>Catálogo Digital</div><div className="headActions"><button className="toplink" onClick={()=>go("/catalog/"+d.business.slug)}><ExternalLink size={16}/>Ver catálogo</button><button className="headIcon" onClick={()=>go("/dashboard/definicoes")} title="Definições"><Settings size={17}/></button></div></header><div className="layout"><aside><Nav icon={<BarChart3/>} text="Início" active={section==="inicio"} on={()=>nav("/dashboard")}/><Nav icon={<Package/>} text="Produtos" active={section==="produtos"} on={()=>nav("/dashboard/produtos")}/><Nav icon={<Star/>} text="Destaques" active={section==="destaques"} on={()=>nav("/dashboard/destaques")}/><Nav icon={<BarChart3/>} text="Estatísticas" active={section==="estatisticas"} on={()=>nav("/dashboard/estatisticas")}/><Nav icon={<Settings/>} text="Definições" active={section==="definicoes"} on={()=>nav("/dashboard/definicoes")}/></aside><main className="content">{section==="inicio"&&<Home d={d} go={go}/>} {section==="produtos"&&<Products d={d} update={update}/>} {section==="destaques"&&<Highlights d={d} update={update}/>} {section==="estatisticas"&&<Stats d={d}/>} {section==="definicoes"&&<SettingsPage d={d} update={update} go={go}/>}</main></div><nav className="bottom">{[["/dashboard","Início",<BarChart3/>],["/dashboard/produtos","Produtos",<Package/>],["/dashboard/destaques","Destaques",<Star/>],["/dashboard/estatisticas","Estatísticas",<BarChart3/>],["/dashboard/definicoes","Definições",<Settings/>]].map(([p,t,i])=><Nav key={String(p)} icon={i} text={String(t)} active={(p==="/dashboard"&&section==="inicio")||(p!=="/dashboard"&&section===String(p).split("/").pop())} on={()=>nav(String(p))}/>)}</nav>{toast&&<div className="toast"><Check size={17}/>{toast}</div>}{undo&&toast&&<button className="undo" onClick={restore}><Undo2 size={16}/>Desfazer</button>}</div>
}
function Nav({icon,text,active,on}:{icon:React.ReactNode;text:string;active:boolean;on:()=>void}){return <button className={"nav "+(active?"active":"")} onClick={on}>{icon}<span>{text}</span></button>}

function Home({d,go}:{d:Data;go:(p:string)=>void}){
 const visits=d.events.filter(e=>e.type==="visit"&&e.date===today()).length;
 const clicks=d.events.filter(e=>e.type==="whatsapp"&&e.date===today()).length;
 const sold=d.products.filter(p=>!p.available).length;
 const total=d.products.length;
 const filled=[d.business.name,d.business.phone,d.business.description,d.business.hours,d.business.location].filter(Boolean).length;
 const completion=Math.round((filled/5)*100);
 const share=async()=>{await shareCatalog(d.business.name,d.business.slug)};
 return <><div className="title"><div><h1>{d.business.name||"Meu negócio"}</h1><p>Painel do catálogo</p></div><button onClick={()=>go("/dashboard/produtos")}><Plus/>Adicionar produto</button></div>
 <div className="stats"><Stat icon={<Eye/>} n={visits} label="visitas hoje"/><Stat icon={<MessageCircle/>} n={clicks} label="cliques WhatsApp hoje"/><Stat icon={<Package/>} n={total} label="produtos"/><Stat icon={<Package/>} n={sold} label="esgotados"/></div>
 <div className="quick"><button onClick={()=>go("/catalog/"+d.business.slug)}><ExternalLink/>Ver catálogo</button><button className="secondary" onClick={share}><Share2/>Partilhar catálogo</button></div>
 <section className="panel progressPanel"><div className="panelTitle"><div><h2>Catálogo {completion===100?"completo":"em preparação"}</h2><p>{completion}% das informações principais preenchidas.</p></div><b>{completion}%</b></div><div className="progress"><span style={{width:completion+"%"}}/></div>{completion<100&&<button className="textBtn" onClick={()=>go("/dashboard/definicoes")}>Completar informações</button>}</section>
 <section className="panel"><div className="panelTitle"><h2>Produtos recentes</h2><button className="textBtn" onClick={()=>go("/dashboard/produtos")}>Ver todos</button></div>{[...d.products].sort((a,b)=>b.order-a.order).slice(0,5).map(p=><ProductRow key={p.id} p={p} compact/>)}{!d.products.length&&<Empty text="Ainda não tens produtos." action="Adicionar produto" on={()=>go("/dashboard/produtos")}/>}</section></>
}
function Stat({icon,n,label}:{icon:React.ReactNode;n:number;label:string}){return <div className="stat">{icon}<b>{n}</b><span>{label}</span></div>}

function Products({d,update}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void}){
 const[q,setQ]=useState("");const[filter,setFilter]=useState<"all"|"available"|"sold">("all");const[category,setCategory]=useState("all");const[editing,setEditing]=useState<Product|null>(null);const[adding,setAdding]=useState(false);const[confirm,setConfirm]=useState<Product|null>(null);
 const categories=useMemo(()=>Array.from(new Set(d.products.map(p=>p.category).filter(Boolean) as string[])).sort((a,b)=>a.localeCompare(b)),[d.products]); const list=useMemo(()=>d.products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())&&(filter==="all"||(filter==="available"?p.available:!p.available))&&(category==="all"||p.category===category)).sort((a,b)=>a.order-b.order),[d.products,q,filter,category]);
 const move=(id:string,dir:number)=>{const ordered=[...d.products].sort((a,b)=>a.order-b.order);const idx=ordered.findIndex(p=>p.id===id);const ni=idx+dir;if(idx<0||ni<0||ni>=ordered.length)return;const ids=ordered.map(p=>p.id);[ids[idx],ids[ni]]=[ids[ni],ids[idx]];update(x=>({...x,products:x.products.map(p=>({...p,order:ids.indexOf(p.id)}))}),"Ordem atualizada")};
 const duplicate=(p:Product)=>update(x=>({...x,products:[...x.products,{...p,id:crypto.randomUUID(),name:p.name+" (cópia)",clicks:0,order:x.products.length}]}),"Produto duplicado");
 return <><div className="title"><div><h1>Produtos</h1><p>{d.products.length} produtos</p></div><button onClick={()=>setAdding(true)}><Plus/>Adicionar</button></div>
 <div className="toolbar"><div className="searchbox"><Search size={18}/><input placeholder="Procurar produto…" value={q} onChange={e=>setQ(e.target.value)}/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">Todos</option><option value="available">Disponíveis</option><option value="sold">Esgotados</option></select></div>
 <div className="products">{list.map((p,i)=><div className="productwrap" key={p.id}><ProductRow p={p} edit={()=>setEditing(p)} toggle={()=>update(x=>({...x,products:x.products.map(y=>y.id===p.id?{...y,available:!y.available}:y)}),"Disponibilidade atualizada")} del={()=>setConfirm(p)} duplicate={()=>duplicate(p)} reorderUp={()=>move(p.id,-1)} reorderDown={()=>move(p.id,1)} first={i===0} last={i===list.length-1}/></div>)}</div>
 {!list.length&&<Empty text={q||filter!=="all"?"Nenhum produto corresponde ao filtro.":"Ainda não tens produtos."} action="Adicionar produto" on={()=>setAdding(true)}/>}
 {(adding||editing)&&<ProductForm initial={editing||undefined} onSave={p=>{update(x=>({...x,products:editing?x.products.map(y=>y.id===p.id?p:y):[...x.products,{...p,order:x.products.length}]}),editing?"Produto atualizado":"Produto adicionado");setAdding(false);setEditing(null)}} onClose={()=>{setAdding(false);setEditing(null)}} onDelete={editing?()=>setConfirm(editing):undefined}/>}
 {confirm&&<Confirm text={'Apagar "'+confirm.name+'"?'} onCancel={()=>setConfirm(null)} onConfirm={()=>{update(x=>({...x,products:x.products.filter(p=>p.id!==confirm.id)}),"Produto apagado");setConfirm(null)}}/>}</>
}
function ProductRow({p,compact,edit,toggle,del,duplicate,reorderUp,reorderDown,first,last}:{p:Product;compact?:boolean;edit?:()=>void;toggle?:()=>void;del?:()=>void;duplicate?:()=>void;reorderUp?:()=>void;reorderDown?:()=>void;first?:boolean;last?:boolean}){
 return <div className={"product "+(!p.available?"sold":"")}><div className="drag">{!compact&&<GripVertical size={17}/>}</div><div className="thumb">{p.image?<img src={p.image} alt={p.name}/>:<Package/>}</div><div className="pinfo"><b>{p.name}</b><span>{p.promo&&p.promo>0?<><s>{money(p.price)}</s> <strong>{money(p.promo)}</strong></>:money(p.price)}</span>{!compact&&p.category&&<small>{p.category}</small>}{!compact&&p.description&&<small>{p.description}</small>}</div>{!compact&&<div className="rowactions"><button className={"status "+(p.available?"ok":"off")} onClick={toggle}>{p.available?"Disponível":"Esgotado"}</button><button className="icon" onClick={reorderUp} disabled={first}>↑</button><button className="icon" onClick={reorderDown} disabled={last}>↓</button><button className="icon" onClick={duplicate}>Duplicar</button><button className="icon" onClick={edit}><Pencil size={17}/></button><button className="icon danger" onClick={del}><Trash2 size={17}/></button></div>}</div>
}

function ProductForm({initial,onSave,onClose,onDelete}:{initial?:Product;onSave:(p:Product)=>void;onClose:()=>void;onDelete?:()=>void}){
 const[p,setP]=useState<Product>(initial||{id:crypto.randomUUID(),name:"",price:0,description:"",available:true,clicks:0,order:0,category:""});const[compression,setCompression]=useState<CompressionKey>("equilibrada");const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 const save=()=>{if(!p.name.trim()){setError("Indica o nome do produto.");return}if(p.price<=0){setError("O preço deve ser maior que zero.");return}if(p.promo!==undefined&&(p.promo<=0||p.promo>=p.price)){setError("A promoção deve ser menor que o preço normal.");return}setError("");onSave(p)};
 return <div className="modal"><div className="modalbox"><div className="modalhead"><h2>{initial?"Editar produto":"Adicionar produto"}</h2><button onClick={onClose}>×</button></div><label>Foto<div className="upload">{p.image?<img src={p.image}/>:<><ImagePlus/><span>Escolher foto</span></>}<input type="file" accept="image/*" onChange={async e=>{if(e.target.files?.[0]){setBusy(true);try{setP({...p,image:await fileToData(e.target.files[0],compression)});setError("")}catch{setError("Não foi possível carregar esta imagem.")}finally{setBusy(false)}}}}/></div></label><label>Compressão da imagem<select value={compression} onChange={e=>setCompression(e.target.value as CompressionKey)}><option value="leve">Leve — mais pequena</option><option value="equilibrada">Equilibrada — recomendada</option><option value="alta">Alta qualidade — maior</option></select></label><label>Nome<input value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></label><div className="twocol"><label>Preço (Kz)<input type="number" min="1" value={p.price||""} onChange={e=>setP({...p,price:Number(e.target.value)})}/></label><label>Promoção (Kz)<input type="number" min="1" value={p.promo||""} onChange={e=>setP({...p,promo:e.target.value?Number(e.target.value):undefined})}/></label></div><label>Descrição curta<textarea maxLength={160} value={p.description} onChange={e=>setP({...p,description:e.target.value})}/></label><label className="check"><input type="checkbox" checked={p.available} onChange={e=>setP({...p,available:e.target.checked})}/> Disponível</label>{error&&<div className="formError">{error}</div>}<button disabled={busy||!p.name.trim()||p.price<=0||(p.promo!==undefined&&(p.promo<=0||p.promo>=p.price))} onClick={save}>{busy?"A carregar foto…":"Guardar"}</button>{initial&&onDelete&&<button className="dangerBtn" onClick={onDelete}>Apagar produto</button>}</div></div>
}

function Highlights({d,update}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void}){
 const[text,setText]=useState("");const[image,setImage]=useState("");const[end,setEnd]=useState("");
 const add=()=>{if(!text.trim())return;update(x=>({...x,highlights:[...x.highlights,{id:crypto.randomUUID(),text:text.trim(),image:image||undefined,active:true,endsAt:end||undefined}]}),"Destaque publicado");setText("");setImage("");setEnd("")};
 return <><div className="title"><div><h1>Destaques</h1><p>Promoções e avisos no topo do catálogo.</p></div></div><div className="highlightForm"><label>Texto<input value={text} onChange={e=>setText(e.target.value)} placeholder="Ex.: Promoção este fim de semana"/></label><label>Imagem<div className="miniUpload">{image?<img src={image}/>:<ImagePlus/>}<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{setImage(await fileToData(file))}catch{}}}/></div></label><label>Fim da promoção<input type="date" min={today()} value={end} onChange={e=>setEnd(e.target.value)}/></label><button disabled={!text.trim()} onClick={add}><Plus/>Publicar anúncio</button></div><div className="highlightList">{d.highlights.map(h=><div className={"highlight "+(!isLive(h)?"muted":"")} key={h.id}>{h.image&&<img src={h.image} alt="Destaque"/>}<div><b>{h.text}</b><small>{h.endsAt?(isLive(h)?"Até ":"Terminou em ")+new Date(h.endsAt+"T00:00:00").toLocaleDateString("pt-AO"):(h.active?"Ativo":"Desativado")}</small></div><button className="icon" onClick={()=>update(x=>({...x,highlights:x.highlights.map(y=>y.id===h.id?{...y,active:!y.active}:y)}),h.active?"Destaque desativado":"Destaque ativado")}>{h.active?"Ocultar":"Activar"}</button><button className="icon danger" onClick={()=>update(x=>({...x,highlights:x.highlights.filter(y=>y.id!==h.id)}),"Destaque apagado")}><Trash2/></button></div>)}</div>{!d.highlights.length&&<Empty text="Ainda não tens destaques." action="Criar destaque" on={()=>document.querySelector<HTMLInputElement>(".highlightForm input")?.focus()}/>}</>
}
function Stats({d}:{d:Data}){const start=new Date();start.setHours(12,0,0,0);start.setDate(start.getDate()-6);const days=Array.from({length:7},(_,i)=>{const dt=new Date(start);dt.setDate(start.getDate()+i);const key=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");return{key,visits:d.events.filter(e=>e.date===key&&e.type==="visit").length,clicks:d.events.filter(e=>e.date===key&&e.type==="whatsapp").length}});const tops=[...d.products].sort((a,b)=>b.clicks-a.clicks).slice(0,5);return <><div className="title"><div><h1>Estatísticas</h1><p>Dados simples dos últimos 7 dias.</p></div></div><div className="stats"><Stat icon={<Eye/>} n={days.reduce((a,x)=>a+x.visits,0)} label="visitas / 7 dias"/><Stat icon={<MessageCircle/>} n={days.reduce((a,x)=>a+x.clicks,0)} label="cliques WhatsApp / 7 dias"/><Stat icon={<Package/>} n={d.products.filter(p=>!p.available).length} label="esgotados agora"/></div><section className="panel"><h2>Movimento por dia</h2><div className="days">{days.map(x=><div key={x.key}><b>{x.visits}</b><span>{new Date(x.key+"T00:00:00").toLocaleDateString("pt-AO",{weekday:"short"}).replace(".","")}</span></div>)}</div></section><section className="panel"><h2>Produtos mais clicados</h2>{tops.map(p=><div className="rank" key={p.id}><span>{p.name}</span><b>{p.clicks}</b></div>)}{!tops.length&&<p className="mutedText">Ainda não há cliques.</p>}</section></>
}

function SettingsPage({d,update,go}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void;go:(p:string)=>void}){
 const[b,setB]=useState(d.business);const[cover,setCover]=useState(d.business.cover||"");const[url,setUrl]=useState("");
 useEffect(()=>setUrl(location.origin+"/catalog/"+slugify(b.slug||b.name)),[b.slug,b.name]);
 const save=()=>update(x=>({...x,business:{...b,slug:slugify(b.slug||b.name),cover}}),"Definições guardadas");
 const copy=async()=>{await navigator.clipboard?.writeText(url);};
 return <><div className="title"><div><h1>Definições</h1><p>Informações que aparecem no catálogo.</p></div></div><div className="formbox wide"><label>Nome<input value={b.name} onChange={e=>setB({...b,name:e.target.value})}/></label><label>WhatsApp<input inputMode="tel" value={b.phone} onChange={e=>setB({...b,phone:e.target.value})}/></label><label>Tipo<select value={b.template} onChange={e=>setB({...b,template:e.target.value})}><option>Loja</option><option>Restaurante</option><option>Agricultor</option><option>Serviços</option></select></label><label>Link personalizado<input value={b.slug} onChange={e=>setB({...b,slug:e.target.value})} onBlur={()=>setB(x=>({...x,slug:slugify(x.slug)}))}/></label><label>Foto de capa / logo<div className="upload small">{cover?<img src={cover} alt="Capa do negócio"/>:<><ImagePlus/><span>Escolher foto</span></>}<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{setCover(await fileToData(file))}catch{}}}/></div></label><label>Apresentação<textarea maxLength={220} value={b.description} onChange={e=>setB({...b,description:e.target.value})}/></label><div className="twocol"><label><Clock/> Horário<input value={b.hours} onChange={e=>setB({...b,hours:e.target.value})} placeholder="08:00 - 18:00"/></label><label><MapPin/> Localização<input value={b.location} onChange={e=>setB({...b,location:e.target.value})}/></label></div><button onClick={save}>Guardar alterações</button><div className="sharebox"><span>{url}</span><button className="secondary" onClick={copy}><Copy/>Copiar link</button><button className="secondary" onClick={()=>go("/catalog/"+b.slug)}><ExternalLink/>Abrir</button></div><button className="logout" onClick={()=>{update(x=>({...x,loggedIn:false}));go("/login")}}><LogOut/>Sair da conta</button></div></>
}

function Public({d,update}:{d:Data;update:(fn:(x:Data)=>Data,msg?:string)=>void}){
 const counted=useRef(false);const[q,setQ]=useState("");const[category,setCategory]=useState("all");
 useEffect(()=>{const key="catalog-visit:"+d.business.slug+":"+today();if(counted.current)return;counted.current=true;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1")}catch{}update(x=>({...x,events:[...x.events,{date:today(),type:"visit"}]}))},[d.business.slug,update]);
 const active=d.highlights.filter(isLive);const categories=Array.from(new Set(d.products.map(p=>p.category).filter(Boolean) as string[])).sort((a,b)=>a.localeCompare(b));const products=[...d.products].sort((a,b)=>a.order-b.order).filter(p=>p.name.toLowerCase().includes(q.toLowerCase())&&(category==="all"||p.category===category));
 const click=(p?:Product)=>update(x=>({...x,events:[...x.events,{date:today(),type:"whatsapp",productId:p?.id}],products:p?x.products.map(y=>y.id===p.id?{...y,clicks:y.clicks+1}:y):x.products}));
 return <main className="public"><header className="publicTop"><span className="brand"><Store/>Catálogo</span><button className="publicShare" onClick={()=>shareCatalog(d.business.name,d.business.slug)}><Share2 size={16}/>Partilhar</button></header><div className="storehead">{d.business.cover?<img className="coverImg" src={d.business.cover} alt={d.business.name||"Capa do catálogo"}/>:<div className="cover"><Store/></div>}<h1>{d.business.name||"Catálogo"}</h1>{d.business.description&&<p>{d.business.description}</p>}<div className="meta">{d.business.hours&&<span><Clock size={15}/>{d.business.hours}</span>}{d.business.location&&<span><MapPin size={15}/>{d.business.location}</span>}</div>{d.business.phone&&<a className="wa" href={wa(d.business.phone,"Olá, vi o vosso catálogo e gostaria de saber mais.")} onClick={()=>click()}><MessageCircle/>Falar no WhatsApp</a>}</div>{active.length>0&&<section><h2>Destaques</h2><div className="highlights">{active.map(h=><div className="highlight card" key={h.id}>{h.image&&<img src={h.image}/>}<b>{h.text}</b></div>)}</div></section>}<section><div className="publicSectionHead"><h2>Produtos <small>{products.length}</small></h2><div className="publicFilters">{categories.length>0&&<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>}<div className="publicSearch"><Search size={16}/><input placeholder="Procurar…" value={q} onChange={e=>setQ(e.target.value)}/></div></div><div className="publicproducts">{products.map(p=><article className={!p.available?"sold":""} key={p.id}>{p.image&&<img src={p.image} alt={p.name}/>}<div className="articlebody"><h3>{p.name}</h3>{p.description&&<p>{p.description}</p>}<div className="price">{p.promo&&p.promo>0?<><s>{money(p.price)}</s><b>{money(p.promo)}</b></>:money(p.price)}</div>{p.available&&d.business.phone?<a className="buy" href={wa(d.business.phone,"Olá, quero o produto "+p.name+".")} onClick={()=>click(p)}><MessageCircle/>Quero este</a>:<span className="soldlabel">Esgotado</span>}</div></article>)}</div>{!products.length&&<div className="empty"><p>{q?"Nenhum produto encontrado.":"Catálogo ainda sem produtos."}</p></div>}</section><footer>Catálogo Digital</footer></main>
}
function Empty({text,action,on}:{text:string;action:string;on:()=>void}){return <div className="empty"><p>{text}</p><button onClick={on}>{action}</button></div>}
function Confirm({text,onCancel,onConfirm}:{text:string;onCancel:()=>void;onConfirm:()=>void}){return <div className="modal"><div className="modalbox confirm"><h2>Confirmar</h2><p>{text}</p><div><button className="secondary" onClick={onCancel}>Cancelar</button><button className="dangerBtn" onClick={onConfirm}>Apagar</button></div></div></div>}