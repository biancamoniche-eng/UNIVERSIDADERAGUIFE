/* ============================================================
   xlsx.js — gerador de planilhas .xlsx em JavaScript puro.
   Sem dependências. Monta o pacote OOXML (Open XML) e compacta
   num ZIP (com CRC32 e armazenamento STORE) — abre no Excel/Sheets.

   Uso:
     downloadXlsx('relatorio.xlsx', [
       { name:'Trilhas', rows:[['Col A','Col B'],['x',1]] },
       { name:'Eventos', rows:[[...]] }
     ]);
============================================================ */
(function(){
  // ---- CRC32 ----
  const crcTable=(function(){const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=crcTable[(c^bytes[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}

  const enc=new TextEncoder();
  function strBytes(s){return enc.encode(s);}

  // ---- ZIP (STORE, sem compressão) ----
  function buildZip(files){ // files: [{name, data(Uint8Array)}]
    const chunks=[];const central=[];let offset=0;
    const u16=v=>[v&0xFF,(v>>8)&0xFF];
    const u32=v=>[v&0xFF,(v>>8)&0xFF,(v>>16)&0xFF,(v>>24)&0xFF];
    files.forEach(f=>{
      const nameB=strBytes(f.name);const data=f.data;const crc=crc32(data);
      const local=[].concat([0x50,0x4b,0x03,0x04],u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameB.length),u16(0));
      const localHeader=new Uint8Array(local);
      chunks.push(localHeader,nameB,data);
      const cen=[].concat([0x50,0x4b,0x01,0x02],u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameB.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset));
      central.push({head:new Uint8Array(cen),name:nameB});
      offset+=localHeader.length+nameB.length+data.length;
    });
    const cenChunks=[];let cenSize=0;
    central.forEach(c=>{cenChunks.push(c.head,c.name);cenSize+=c.head.length+c.name.length;});
    const end=[].concat([0x50,0x4b,0x05,0x06],u16(0),u16(0),u16(files.length),u16(files.length),u32(cenSize),u32(offset),u16(0));
    const all=[...chunks,...cenChunks,new Uint8Array(end)];
    let total=0;all.forEach(a=>total+=a.length);
    const out=new Uint8Array(total);let p=0;all.forEach(a=>{out.set(a,p);p+=a.length;});
    return out;
  }

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function colRef(n){let s='';n++;while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;}

  function sheetXml(rows){
    let body='';
    rows.forEach((row,ri)=>{
      let cells='';
      row.forEach((val,ci)=>{
        const ref=colRef(ci)+(ri+1);
        if(typeof val==='number'&&isFinite(val)){
          cells+=`<c r="${ref}"><v>${val}</v></c>`;
        }else{
          cells+=`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(val)}</t></is></c>`;
        }
      });
      body+=`<row r="${ri+1}">${cells}</row>`;
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
  }

  function buildXlsx(sheets){
    // sheets: [{name, rows}]
    const files=[];
    files.push({name:'[Content_Types].xml',data:strBytes(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`)});
    files.push({name:'_rels/.rels',data:strBytes(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)});
    const sheetTabs=sheets.map((s,i)=>`<sheet name="${esc((s.name||('Planilha'+(i+1))).slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('');
    files.push({name:'xl/workbook.xml',data:strBytes(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetTabs}</sheets></workbook>`)});
    files.push({name:'xl/_rels/workbook.xml.rels',data:strBytes(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`)});
    sheets.forEach((s,i)=>{files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:strBytes(sheetXml(s.rows||[]))});});
    return buildZip(files);
  }

  window.downloadXlsx=function(filename,sheets){
    try{
      const bytes=buildXlsx(sheets);
      const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      if(typeof toast==='function')toast('Relatório exportado');
    }catch(e){console.error(e);if(typeof toast==='function')toast('Falha ao gerar planilha',true);}
  };
})();
