import {Run,isLegacyResult} from '../types/domain';import {percent} from '../utils/format';
export function AttributionSummary({run}:{run:Run}){
  const r=run.result;const legacy=isLegacyResult(r);
  return <div className="attribution-summary">
    <div><span className="eyebrow">OBSERVED JOURNEYS / {r.journey_count}</span><h3>{r.batch.name}</h3><p>保留循环触点 · {r.conversions} 个CONVERSION终点{legacy?' · 旧口径v1':r.direct_paths?` · 其中直接路径 ${r.direct_paths} 条`:''}</p></div>
    <div><span>基准吸收概率{legacy?'':'（带触点路径）'}</span><b>{percent(r.base_probability)}</b><small>关联模型 / 非因果增量</small>{!legacy&&r.observed_conversion_rate!==undefined&&<small>观察转化率 {percent(r.observed_conversion_rate)}</small>}</div>
  </div>;
}
