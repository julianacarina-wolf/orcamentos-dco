const D = window.APP_DATA;
const P = window.LINK_DATA_PRICING;
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = s => document.querySelector(s);
const norm = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
const option = (v,t) => `<option value="${String(v).replaceAll('"','&quot;')}">${t}</option>`;

function yearFactor(year){let f=1;for(let y=2022;y<=Number(year);y++)f*=1+(P.reajustes[y]||0);return f;}
function discountFor(mbps){const v=Number(mbps);const b=P.faixasDesconto.find(x=>v>=Number(x.min)&&v<=Number(x.max));return b?{min:+b.min,max:+b.max,fator:+b.fator,percentualDesconto:1-(+b.fator)}:null;}
function regionRecord(municipio){return D.regioes.find(x=>norm(x.municipio)===norm(municipio))||null;}
function allowedTechnologies(municipio){
  const row=regionRecord(municipio); if(!row)return [];
  const attended=['SIM','1','TRUE'].includes(norm(row.atendido??''));
  if(!attended||norm(row.ultimaMilha).includes('SEMINFRA'))return [];
  const raw=String(row.ultimaMilha||'').split(/[,;/]+/).map(v=>norm(v)).filter(Boolean);
  const supported=['FIBRA','RADIO','SATELITE'];
  return [...new Set(raw.filter(v=>supported.includes(v)))];
}
function technologyLabel(value){return ({FIBRA:'FIBRA',RADIO:'RÁDIO',SATELITE:'SATÉLITE'})[norm(value)]||value;}
function setTechnologyOptions(tr,preferred=''){
  const select=tr.querySelector('.tipo'); if(!select)return;
  const municipio=tr.querySelector('.muni')?.value||'';
  const allowed=allowedTechnologies(municipio);
  const previous=norm(preferred||select.value);
  select.innerHTML=allowed.length?allowed.map(t=>option(t,technologyLabel(t))).join(''):'<option value="">Sem tecnologia disponível</option>';
  if(allowed.includes(previous))select.value=previous;
  else if(allowed.length)select.value=allowed[0];
  select.disabled=!allowed.length;
}
function infrastructureFor(municipio, modalidade){
  const row=regionRecord(municipio);
  if(!row)return{available:false,row:null,reason:'Município não localizado na aba Região.'};
  const allowed=allowedTechnologies(municipio);
  if(!allowed.length)return{available:false,row,reason:'Município sem última milha disponível na infraestrutura da PRODEPA.'};
  const tech=norm(modalidade);
  if(!allowed.includes(tech))return{available:false,row,reason:`Tecnologia incompatível com a última milha disponível: ${row.ultimaMilha}.`};
  return{available:true,row,allowed,reason:''};
}
function officialLinkPrice(municipio,modalidade,mbps,year){
  const infra=infrastructureFor(municipio,modalidade); if(!infra.available)return{error:infra.reason,infrastructureBlocked:true,source:infra.row};
  const priceRow=P.linkDados.find(x=>norm(x.municipio)===norm(municipio)&&norm(x.modalidade)===norm(modalidade));
  if(!priceRow)return{error:'Preço não localizado na aba Link Dados para o município e a última milha selecionada.',source:null};
  const faixa=discountFor(mbps); if(!faixa)return{error:'Banda fora das faixas de pconfig (1 a 10.240 Mbps).'};
  const transporteSemDesconto=Number(priceRow.unitTransporte2026)*Number(mbps);
  const transporteComDesconto=transporteSemDesconto*faixa.fator;
  const manutencaoBase=Number(priceRow.cmanut2026);
  const total2021=transporteComDesconto+manutencaoBase;
  const total=total2021*yearFactor(year);
  return{total,unitario:total/Number(mbps),source:priceRow,breakdown:{faixa}};
}
function regionalLinkPrice(municipio,mbps){const r=D.regioes.find(x=>norm(x.municipio)===norm(municipio));if(!r||!mbps)return null;const total=Number(r.precoMbps||0)*Number(mbps);return{total,unitario:Number(r.precoMbps||0),source:r};}
function regionFor(municipio){return regionRecord(municipio)?.regiao||'';}
function currentMethod(){return $('#anoTabela').value==='regional'?'regional':'oficial';}
function currentYear(){return currentMethod()==='oficial'?Number($('#anoTabela').value):2026;}

const municipalities=[...new Set(D.regioes.map(r=>r.municipio).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
const muniOptions='<option value="">Município...</option>'+municipalities.map(m=>option(m,m)).join('');
const allTiServices=D.servicos.map((s,i)=>({s,i})).filter(({s})=>{const d=norm(s.descricao);return d!=='LINKDEDADOS'&&d!=='INTERNET'&&!d.startsWith('IMPLANTACAODEINFRAESTRUTURA');});
const isAnnualService=s=>norm(s.faturamento).includes('PAGAMENTOUNICOANUAL');
const tiServices=allTiServices.filter(({s})=>!isAnnualService(s));
const tiAnnualServices=allTiServices.filter(({s})=>isAnnualService(s));
const tiOptions='<option value="">Serviço...</option>'+tiServices.map(({s,i})=>option(i,`${s.descricao}${s.tipo?' — '+s.tipo:''}`)).join('');
const tiAnnualOptions='<option value="">Serviço anual...</option>'+tiAnnualServices.map(({s,i})=>option(i,`${s.descricao}${s.tipo?' — '+s.tipo:''}`)).join('');
const tableKeys=['implantacao','link','internet','ti','tiAnual'];
function tableIncluded(key){return document.querySelector(`.table-toggle[data-target="${key}"]`)?.checked!==false;}
function setTableIncluded(key,included){document.querySelectorAll(`[data-target="${key}"].table-toggle,[data-target="${key}"].inline-table-toggle`).forEach(e=>e.checked=!!included);document.querySelector(`[data-table-key="${key}"]`)?.classList.toggle('excluded-table',!included);totals();}
function initTableToggles(){document.querySelectorAll('.table-toggle,.inline-table-toggle').forEach(e=>e.onchange=()=>setTableIncluded(e.dataset.target,e.checked));tableKeys.forEach(k=>setTableIncluded(k,true));}

function init(){
  $('#data').value=new Date().toISOString().slice(0,10);
  $('#cliente').innerHTML='<option value="">Selecione...</option>'+D.clientes.map((c,i)=>option(i,`${c.sigla} — ${c.instituicao}`)).join('');
  $('#anoTabela').innerHTML=[2021,2022,2023,2024,2025,2026].map(y=>option(y,y)).join('')+option('regional','Região de Integração (teste)'); $('#anoTabela').value='2026';
  $('#cliente').onchange=fillClient; $('#anoTabela').onchange=()=>{updateMethodUI();recalcAll();};
  $('#addLinkBtn').onclick=()=>addAccessRow('link'); $('#addInternetBtn').onclick=()=>addAccessRow('internet'); $('#addTiBtn').onclick=()=>addTiRow('regular'); $('#addTiAnnualBtn').onclick=()=>addTiRow('annual'); $('#addInstallationBtn').onclick=()=>addInstallationRow(); initTableToggles();
  $('#printBtn').onclick=()=>window.print(); $('#saveBtn').onclick=save; $('#newBtn').onclick=reset; updateMethodUI();
  const saved=localStorage.getItem('orcamentoAtual'); if(saved)load(JSON.parse(saved)); else {addInstallationRow();addAccessRow('link');addAccessRow('internet');addTiRow('regular');addTiRow('annual');}
}
function updateMethodUI(){const o=currentMethod()==='oficial';$('#baseStatus').textContent=o?`Link Dados — tabela ${currentYear()} (oficial)`:'Região de Integração — junho/2026 (teste)';$('#methodNote').textContent=o?'Cálculo oficial: preço-base de 2021, descontos de pconfig e reajustes cumulativos até o ano selecionado.':'Metodologia experimental com preço unificado por Região de Integração.';}
function fillClient(){const c=D.clientes[$('#cliente').value];if(!c)return;$('#cnpj').value=c.cnpj;$('#instituicao').value=c.instituicao;$('#responsavel').value=c.representante;$('#cargo').value=c.cargo;$('#telefone').value=c.telefone;$('#municipioCliente').value=c.municipio;$('#endereco').value=[c.endereco,c.bairro,c.cep,c.municipio,c.uf].filter(Boolean).join(', ');}

function addAccessRow(kind,data={}){
  const tbody=kind==='link'?$('#linkItems'):$('#internetItems'); const tr=document.createElement('tr'); tr.dataset.kind=kind;
  tr.innerHTML=`<td><select class="muni">${muniOptions}</select><small class="coverage"></small></td><td><input class="regiao" readonly placeholder="Região"></td><td><input class="unidade" placeholder="Nome da unidade"></td><td><select class="tipo"><option value="">Selecione o município</option></select></td><td><input class="qtd" type="number" min="1" step="1" value="1"></td><td><input class="unit" type="number" min="0" step="0.01"></td><td class="money mensal">R$ 0,00</td><td><small class="priceSource"></small></td><td><button class="remove">×</button></td>`;
  tbody.appendChild(tr); ['muni','regiao','unidade','qtd','unit'].forEach(k=>{if(data[k]!=null)tr.querySelector('.'+k).value=data[k];}); setTechnologyOptions(tr,data.tipo);
  const unitInput=tr.querySelector('.unit');
  if(kind==='link'){unitInput.readOnly=true;unitInput.dataset.calculated='1';delete unitInput.dataset.manual;}
  else if(data.manualUnit){unitInput.dataset.manual='1';}
  tr.querySelector('.muni').onchange=()=>{if(kind!=='link')delete tr.querySelector('.unit').dataset.manual;setTechnologyOptions(tr);recalcAccessRow(tr);};
  tr.querySelector('.tipo').onchange=()=>{if(kind!=='link')delete tr.querySelector('.unit').dataset.manual;recalcAccessRow(tr);};
  tr.querySelector('.qtd').oninput=()=>recalcAccessRow(tr);
  tr.querySelector('.unidade').oninput=()=>recalcAccessRow(tr);
  if(kind==='internet'){tr.querySelector('.unit').oninput=()=>recalcAccessRow(tr);tr.querySelector('.unit').onchange=e=>e.target.dataset.manual='1';}
  tr.querySelector('.remove').onclick=()=>{tr.remove();totals();}; recalcAccessRow(tr);
}
function recalcAccessRow(tr){
  const kind=tr.dataset.kind, municipio=tr.querySelector('.muni').value; setTechnologyOptions(tr,tr.querySelector('.tipo').value); const tipo=tr.querySelector('.tipo').value,qtd=Number(tr.querySelector('.qtd').value||0),unit=tr.querySelector('.unit'),src=tr.querySelector('.priceSource'),cov=tr.querySelector('.coverage');
  tr.querySelector('.regiao').value=regionFor(municipio);
  let total=0; const infra=municipio?infrastructureFor(municipio,tipo):{available:false,reason:'Selecione o município.'};
  if(!municipio){delete tr.dataset.invalidInfrastructure;tr.classList.remove('invalid-infrastructure');cov.textContent='Selecione o município';src.textContent='';unit.disabled=false;}
  else if(!infra.available){tr.dataset.invalidInfrastructure='1';tr.classList.add('invalid-infrastructure');cov.textContent='Sem infraestrutura PRODEPA';src.textContent=`BLOQUEADO: ${infra.reason}`;src.classList.add('blocked-message');unit.value='';unit.disabled=true;}
  else{
    delete tr.dataset.invalidInfrastructure;tr.classList.remove('invalid-infrastructure');src.classList.remove('blocked-message');cov.textContent=`Última milha: ${infra.row.ultimaMilha}`;unit.disabled=false;
    if(kind==='link'){
      const r=currentMethod()==='oficial'?officialLinkPrice(municipio,tipo,qtd,currentYear()):regionalLinkPrice(municipio,qtd);
      if(r&&!r.error&&Number.isFinite(r.total)&&Number.isFinite(r.unitario)){
        unit.value=r.unitario.toFixed(2);total=r.total;
        src.textContent=currentMethod()==='oficial'?`${currentYear()} · ${r.source.degrau||'-'} · faixa ${r.breakdown.faixa.min}-${r.breakdown.faixa.max} Mbps · fator ${r.breakdown.faixa.fator.toFixed(4)}`:`Teste · ${r.source.regiao}`;
      }else{
        unit.value='';total=0;src.textContent=r?.error||'Preço não localizado';
      }
    }
    if(kind==='internet'&&!unit.dataset.manual){unit.value=Number(D.config.internetMbps||23).toFixed(2);src.textContent=`Atendido · ${tipo}`;}
    if(!total)total=qtd*Number(unit.value||0);
  }
  if(!infra.available)total=0; tr.dataset.mensal=total;tr.querySelector('.mensal').textContent=brl.format(total);totals();
}

function addTiRow(kind='regular',data={}){
  if(typeof kind==='object'){data=kind;kind='regular';}
  const annual=kind==='annual', tbody=annual?$('#tiAnnualItems'):$('#tiItems'), options=annual?tiAnnualOptions:tiOptions;
  const tr=document.createElement('tr');tr.dataset.tiKind=kind;tr.innerHTML=`<td><input class="unidade" placeholder="Unidade ou setor"></td><td><select class="serv">${options}</select></td><td><input class="tipo" readonly></td><td><input class="grandeza" readonly></td><td><input class="qtd" type="number" min="0" step="1" value="1"></td><td><input class="unit" type="number" min="0" step="0.01"></td><td class="money total">R$ 0,00</td><td><small class="billing"></small></td><td><button class="remove">×</button></td>`;tbody.appendChild(tr);
  ['unidade','serv','qtd','unit'].forEach(k=>{if(data[k]!=null)tr.querySelector('.'+k).value=data[k];});if(data.manualUnit)tr.querySelector('.unit').dataset.manual='1';
  tr.querySelectorAll('input,select').forEach(e=>e.oninput=()=>recalcTiRow(tr));tr.querySelector('.unit').onchange=e=>e.target.dataset.manual='1';tr.querySelector('.remove').onclick=()=>{tr.remove();totals();};recalcTiRow(tr);
}
function recalcTiRow(tr){
  const annual=tr.dataset.tiKind==='annual',s=D.servicos[tr.querySelector('.serv').value],qtd=Number(tr.querySelector('.qtd').value||0),unit=tr.querySelector('.unit');
  if(!s){tr.querySelector('.tipo').value='';tr.querySelector('.grandeza').value='';tr.querySelector('.billing').textContent='';tr.dataset.monthly=0;tr.dataset.nonmonthly=0;tr.dataset.annual=0;tr.querySelector('.total').textContent=brl.format(0);totals();return;}
  tr.querySelector('.tipo').value=s.tipo||'';tr.querySelector('.grandeza').value=s.grandeza||'';tr.querySelector('.billing').textContent=s.faturamento||'';
  if(!unit.dataset.manual){const defaultValue=annual?(Number(s.precoAnual||0)||Number(s.precoMensal||0)*12):Number(s.precoMensal||s.precoAnual||0);unit.value=defaultValue.toFixed(2);}
  const total=qtd*Number(unit.value||0),monthly=!annual&&norm(s.faturamento)==='MENSAL';tr.dataset.monthly=monthly?total:0;tr.dataset.nonmonthly=!annual&&!monthly?total:0;tr.dataset.annual=annual?total:0;tr.querySelector('.total').textContent=brl.format(total);totals();
}

function installationCalculation(custo,tipo){const activation=Number(D.config.ativacao||0),configuration=norm(tipo)==='RADIO'?Number(D.config.configRadio||0):Number(D.config.configFibra||0),gross=Number(custo||0)+activation+configuration,administrative=gross*Number(D.config.taxaAdministrativa||0),reequipment=gross*Number(D.config.reaparelhamento||0),taxes=gross*Number(D.config.impostos||0);return{activation,configuration,total:gross+administrative+reequipment+taxes};}
function addInstallationRow(data={}){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><select class="muni">${muniOptions}</select><small class="installation-status"></small></td><td><input class="regiao" readonly placeholder="Região"></td><td><input class="unidade" placeholder="Nome da unidade"></td><td><select class="tipo"><option value="">Selecione o município</option></select></td><td><input class="descricao" placeholder="Implantação do acesso"></td><td class="internal-only"><input class="custo" type="number" min="0" step="0.01" value="0"></td><td class="money internal-only ativacao">R$ 0,00</td><td class="money internal-only configuracao">R$ 0,00</td><td class="money valor-final">R$ 0,00</td><td><button class="remove">×</button></td>`;
  $('#installations').appendChild(tr);
  ['muni','regiao','unidade','descricao','custo'].forEach(k=>{if(data[k]!=null)tr.querySelector('.'+k).value=data[k];});
  setTechnologyOptions(tr,data.tipo);
  tr.querySelector('.muni').onchange=()=>{setTechnologyOptions(tr);recalcInstallationRow(tr);};
  tr.querySelector('.tipo').onchange=()=>recalcInstallationRow(tr);
  tr.querySelectorAll('input:not(.regiao)').forEach(e=>e.oninput=()=>recalcInstallationRow(tr));
  tr.querySelector('.remove').onclick=()=>{tr.remove();totals();};
  recalcInstallationRow(tr);
}
function recalcInstallationRow(tr){
  const municipio=tr.querySelector('.muni').value; setTechnologyOptions(tr,tr.querySelector('.tipo').value);
  const tipo=tr.querySelector('.tipo').value,infra=municipio?infrastructureFor(municipio,tipo):{available:false,reason:'Selecione o município.'},status=tr.querySelector('.installation-status');
  tr.querySelector('.regiao').value=regionFor(municipio);
  if(!municipio){delete tr.dataset.invalidInfrastructure;tr.classList.remove('invalid-infrastructure');status.textContent='Selecione o município';}
  else if(!infra.available){tr.dataset.invalidInfrastructure='1';tr.classList.add('invalid-infrastructure');status.textContent=`BLOQUEADO: ${infra.reason}`;}
  else{delete tr.dataset.invalidInfrastructure;tr.classList.remove('invalid-infrastructure');status.textContent=`Última milha disponível: ${infra.row.ultimaMilha}`;}
  const calc=installationCalculation(Number(tr.querySelector('.custo').value||0),tipo);
  tr.querySelector('.ativacao').textContent=brl.format(calc.activation);tr.querySelector('.configuracao').textContent=brl.format(calc.configuration);
  const total=municipio&&infra.available?calc.total:0;tr.querySelector('.valor-final').textContent=brl.format(total);tr.dataset.total=total;totals();
}

function recalcAll(){document.querySelectorAll('#linkItems tr,#internetItems tr').forEach(recalcAccessRow);}
function totals(){let mensal=0,impl=0,pontual=0,tiAnual=0;if(tableIncluded('link'))document.querySelectorAll('#linkItems tr').forEach(tr=>mensal+=Number(tr.dataset.mensal||0));if(tableIncluded('internet'))document.querySelectorAll('#internetItems tr').forEach(tr=>mensal+=Number(tr.dataset.mensal||0));if(tableIncluded('ti'))document.querySelectorAll('#tiItems tr').forEach(tr=>{mensal+=Number(tr.dataset.monthly||0);pontual+=Number(tr.dataset.nonmonthly||0);});if(tableIncluded('tiAnual'))document.querySelectorAll('#tiAnnualItems tr').forEach(tr=>tiAnual+=Number(tr.dataset.annual||0));if(tableIncluded('implantacao'))document.querySelectorAll('#installations tr').forEach(tr=>impl+=Number(tr.dataset.total||0));$('#totalMensal').textContent=brl.format(mensal);$('#totalImpl').textContent=brl.format(impl);$('#totalPontual').textContent=brl.format(pontual);$('#totalTiAnual').textContent=brl.format(tiAnual);$('#totalAnual').textContent=brl.format(mensal*12);$('#totalGlobal').textContent=brl.format(mensal*12+pontual+tiAnual+impl);}
function rowData(tr,keys){return Object.fromEntries(keys.map(k=>[k,tr.querySelector('.'+k).value]));}
function snapshot(){return{numero:$('#numero').value,data:$('#data').value,cliente:$('#cliente').value,obs:$('#obs').value,anoTabela:$('#anoTabela').value,includedTables:Object.fromEntries(tableKeys.map(k=>[k,tableIncluded(k)])),linkItems:[...document.querySelectorAll('#linkItems tr')].map(tr=>({...rowData(tr,['muni','regiao','unidade','tipo','qtd','unit']),manualUnit:false})),internetItems:[...document.querySelectorAll('#internetItems tr')].map(tr=>({...rowData(tr,['muni','regiao','unidade','tipo','qtd','unit']),manualUnit:!!tr.querySelector('.unit').dataset.manual})),tiItems:[...document.querySelectorAll('#tiItems tr')].map(tr=>({...rowData(tr,['unidade','serv','qtd','unit']),manualUnit:!!tr.querySelector('.unit').dataset.manual})),tiAnnualItems:[...document.querySelectorAll('#tiAnnualItems tr')].map(tr=>({...rowData(tr,['unidade','serv','qtd','unit']),manualUnit:!!tr.querySelector('.unit').dataset.manual})),installations:[...document.querySelectorAll('#installations tr')].map(tr=>rowData(tr,['muni','regiao','unidade','tipo','descricao','custo']))};}
function save(){const selectors=[];if(tableIncluded('link'))selectors.push('#linkItems tr');if(tableIncluded('internet'))selectors.push('#internetItems tr');if(tableIncluded('implantacao'))selectors.push('#installations tr');const blocked=selectors.length?[...document.querySelectorAll(selectors.join(','))].filter(tr=>tr.dataset.invalidInfrastructure==='1'):[];if(blocked.length){alert(`Não foi possível salvar. Há ${blocked.length} item(ns) incluído(s) no orçamento sem infraestrutura da PRODEPA. Remova o item, corrija o município ou exclua a respectiva tabela do orçamento.`);blocked[0].scrollIntoView({behavior:'smooth',block:'center'});return;}localStorage.setItem('orcamentoAtual',JSON.stringify(snapshot()));alert('Orçamento salvo neste navegador.');}
function load(x){$('#numero').value=x.numero||'';$('#data').value=x.data||'';$('#cliente').value=x.cliente||'';fillClient();$('#obs').value=x.obs||'';$('#anoTabela').value=String(x.anoTabela||2026);updateMethodUI();$('#linkItems').innerHTML='';$('#internetItems').innerHTML='';$('#tiItems').innerHTML='';$('#tiAnnualItems').innerHTML='';$('#installations').innerHTML='';
  (x.installations||[]).forEach(addInstallationRow);(x.linkItems||[]).forEach(d=>addAccessRow('link',d));(x.internetItems||[]).forEach(d=>addAccessRow('internet',d));
  if(x.tiItems||x.tiAnnualItems){(x.tiItems||[]).forEach(d=>addTiRow('regular',d));(x.tiAnnualItems||[]).forEach(d=>addTiRow('annual',d));}else{(x.items||[]).forEach(d=>{const sv=D.servicos[d.serv],desc=norm(sv?.descricao);if(desc==='LINKDEDADOS')addAccessRow('link',d);else if(desc==='INTERNET')addAccessRow('internet',d);else if(isAnnualService(sv||{}))addTiRow('annual',d);else addTiRow('regular',d);});}
  if(!document.querySelector('#installations tr'))addInstallationRow();if(!document.querySelector('#linkItems tr'))addAccessRow('link');if(!document.querySelector('#internetItems tr'))addAccessRow('internet');if(!document.querySelector('#tiItems tr'))addTiRow('regular');if(!document.querySelector('#tiAnnualItems tr'))addTiRow('annual');
  tableKeys.forEach(k=>setTableIncluded(k,x.includedTables?.[k]??true));}
function reset(){if(!confirm('Criar um novo orçamento?'))return;localStorage.removeItem('orcamentoAtual');location.reload();}
init();
