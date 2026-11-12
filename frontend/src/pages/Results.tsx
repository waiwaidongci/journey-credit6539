import {useState} from 'react';import {Link,useSearchParams} from 'react-router-dom';import {useResearchData} from '../hooks/useResearch';import {AttributionSummary} from '../components/AttributionSummary';import {ConversionSplit} from '../components/ConversionSplit';import {CreditBars} from '../components/CreditBars';import {DataTable} from '../components/common/DataTable';import {StatusBadge} from '../components/common/StatusBadge';import {Notice} from '../components/common/Notice';import {number,percent} from '../utils/format';import {isLegacyResult} from '../types/domain';
export function Results(){
  const s=useResearchData(true),[params]=useSearchParams(),[selected,setSelected]=useState(Number(params.get('run'))||0);
  const run=s.runs.find(r=>r.id===selected)||s.runs[0];
  const legacy=run?.status==='completed'&&isLegacyResult(run.result);
  const noBudget=run?.status==='completed'&&!legacy&&run.result.budget_eligible===false;
  return <div className="page results-page">
    <div className="page-title"><div><p className="eyebrow">ATTRIBUTION EVIDENCE / 04</p><h1>归因结果<span>份额与移除口径，一起交付。</span></h1></div>{run&&!noBudget&&!legacy&&<Link to={'/scenarios'+(run?'?run='+run.id:'')} className="outline">建立预算情景 →</Link>}</div>
    <Notice message={s.error} retry={s.refresh}/>
    <div className="run-picker"><label>归因档案<select aria-label="归因档案" value={run?.id||''} onChange={e=>setSelected(Number(e.target.value))}>{s.runs.map(r=><option key={r.id} value={r.id}>#{r.id} / {r.name} / {r.status}</option>)}</select></label>{run&&<StatusBadge status={run.status}/>}{legacy&&<span className="legacy-tag">旧统计方式 · v1 原值留存</span>}</div>
    {run?.status==='completed'?<>
      <AttributionSummary run={run}/>
      <ConversionSplit result={run.result}/>
      <CreditBars credits={run.result.credits}/>
      <p className="policy-caption">{run.result.removal_policy}</p>
      <DataTable head={['渠道','相对移除效应','归一份额（带触点）','归因转化数（带触点）','末触点转化','触点次数','关联得分']} >{run.result.credits.map(c=><tr key={c.code}><td>{c.name}</td><td>{percent(c.removal_effect)}</td><td>{percent(c.share)}</td><td>{number(c.credited_conversions)}</td><td>{c.last_touch_conversions}</td><td>{c.touches}</td><td>{number(c.association_score,4)}</td></tr>)}</DataTable>
      <div className="section-heading"><h2>转移矩阵</h2><span>每行概率和为1 / 包含吸收终点{!legacy&&' / 仅由带触点路径计数'}</span></div>
      <DataTable head={['FROM / TO',...run.result.states]}>{run.result.states.map((state,i)=><tr key={state}><td className="mono">{state}</td>{run.result.transition_matrix[i].map((v,j)=><td key={j} className={v>0?'matrix-nonzero':''}>{number(v,3)}</td>)}</tr>)}</DataTable>
      <p className="caption">{run.result.assumptions}<br/>{run.result.normalization}</p>
      {noBudget&&<p className="policy-caption">该批次全部为直接路径（或带触点路径无转化），渠道移除效应与关联得分为零，研究照常完成并留存，但不生成预算建议。</p>}
      <p className="fingerprint">输入SHA256 {run.result.input_hash}</p>
    </>:run?<div className="pending"><h2>{run.status==='failed'?'归因研究未完成':'后台正在求解吸收概率与渠道移除效应'}</h2><p>{run.error||'独立worker执行矩阵求解，本页每2秒更新。'}</p></div>:<p className="empty">尚无研究，请先选择路径批次创建。</p>}
  </div>;
}
