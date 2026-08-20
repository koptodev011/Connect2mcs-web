import Link from "next/link";
import Icon from "@/components/Icon";
import { Btn, Tag } from "@/components/primitives";
import { C } from "@/lib/tokens";
import type { OwnedService, ServiceKind } from "./types";
import styles from "./ServiceCard.module.css";

const SERVICE_META: Record<ServiceKind, { label:string; icon:"tiffin"|"people"|"car"|"help"; tone:string; toneBg:string; viewHref:(id:number)=>string }> = {
  tiffin:{ label:"Tiffin",icon:"tiffin",tone:C.saffron,toneBg:C.saffronLt,viewHref:(id)=>`/tiffin/${id}` },
  maid:{ label:"Maid",icon:"people",tone:C.blue,toneBg:"#DCE5F4",viewHref:(id)=>`/maids/${id}` },
  taxi:{ label:"Taxi",icon:"car",tone:C.gold,toneBg:"#F4E8CC",viewHref:()=>"/taxi" },
  mentor:{ label:"Mentor",icon:"help",tone:C.green,toneBg:C.greenLt,viewHref:(id)=>`/mentorship/${id}` },
};

export const SERVICE_LINKS = ([
  ["tiffin","/tiffin"],["maid","/maids"],["taxi","/taxi"],["mentor","/mentorship"],
] as const).map(([kind,href])=>({ kind,href,...SERVICE_META[kind] }));

function formatUpdatedAt(value:string) {
  if (!value) return "Update date unavailable";
  const date=new Date(value);
  if (Number.isNaN(date.getTime())) return "Update date unavailable";
  return `Updated ${new Intl.DateTimeFormat(undefined,{ dateStyle:"medium" }).format(date)}`;
}

export function ServiceCard({ service,onEdit,onDelete }:{ service:OwnedService; onEdit:(service:OwnedService)=>void; onDelete:(service:OwnedService)=>void }) {
  const meta=SERVICE_META[service.kind];
  return (
    <article className={styles.serviceRow}>
      <div className={styles.head}>
        <span className={styles.icon} style={{ background:meta.toneBg }} aria-hidden="true"><Icon name={meta.icon} size={21} color={meta.tone}/></span>
        <span className={styles.status}>Active</span>
      </div>
      <div>
        <div className={styles.titleRow}><h3 className={styles.name}>{service.title}</h3><Tag color={meta.tone} bg={meta.toneBg}>{meta.label}</Tag></div>
        {service.subtitle && <p className={styles.subtitle}>{service.subtitle}</p>}
      </div>
      {service.meta.length>0 && <div className={styles.meta} aria-label="Service details">{service.meta.map((item,index)=><span key={`${item}-${index}`} className={styles.chip}>{item}</span>)}</div>}
      <div className={styles.footer}>
        <span className={styles.updated}>{formatUpdatedAt(service.updatedAt)}</span>
        <div className={styles.actions}>
          <Link href={meta.viewHref(service.id)} className={styles.link}><Btn kind="ghost" size="sm">View</Btn></Link>
          <Btn kind="outline" size="sm" iconL="settings" onClick={()=>onEdit(service)}>Edit</Btn>
          <Btn kind="ghost" size="sm" className={styles.deleteButton} onClick={()=>onDelete(service)}>Delete</Btn>
        </div>
      </div>
    </article>
  );
}
