import dns from 'dns/promises';
import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

const DEFAULT_CNAME_TARGET = process.env.VERCEL_CNAME_TARGET || 'cname.vercel-dns.com';

async function checkDomainDns(domain: string): Promise<boolean> {
  const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000));
  const checkPromise = (async () => {
    try {
      const cnames = await dns.resolveCname(domain);
      if (cnames.some((c) => c.toLowerCase().includes('vercel') || c.toLowerCase().includes('cname.vercel-dns.com'))) {
        return true;
      }
    } catch (e) {
      try {
        const ips = await dns.resolve4(domain);
        if (ips.includes('76.76.21.21')) {
          return true;
        }
      } catch (e2) {}
    }
    return false;
  })();
  return Promise.race([checkPromise, timeoutPromise]);
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDb();
  const idx = db.domains.findIndex((d) => d.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: { message: "Domínio não encontrado." } }, { status: 404 });
  }

  const domain = db.domains[idx];
  const hostname = domain.hostname || domain.domain;
  const isPointed = await checkDomainDns(hostname);

  if (isPointed) {
    db.domains[idx].status = "ACTIVE";
    db.domains[idx].errorMessage = null;
    db.domains[idx].cnameTarget = DEFAULT_CNAME_TARGET;
    db.domains[idx].updatedAt = new Date().toISOString();
    writeDb(db);
    return NextResponse.json({
      data: db.domains[idx],
      verified: true,
      message: "Domínio verificado com sucesso e apontamento ativo!",
    });
  } else {
    db.domains[idx].status = "PENDING";
    db.domains[idx].cnameTarget = DEFAULT_CNAME_TARGET;
    db.domains[idx].errorMessage = `Apontamento CNAME para ${DEFAULT_CNAME_TARGET} ainda não detectado. Verifique no seu DNS (Cloudflare/Registro) e aguarde a propagação.`;
    db.domains[idx].updatedAt = new Date().toISOString();
    writeDb(db);
    return NextResponse.json({
      data: db.domains[idx],
      verified: false,
      message: `Apontamento CNAME para ${DEFAULT_CNAME_TARGET} ainda não propagado. Aguarde alguns minutos e tente novamente.`,
    });
  }
}
