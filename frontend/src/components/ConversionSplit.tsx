import {AttributionResult,isLegacyResult} from '../types/domain';
import {number,percent} from '../utils/format';

export function ConversionSplit({result}:{result:AttributionResult}){
  const legacy=isLegacyResult(result);
  if(legacy){
    return <section className="conversion-split legacy">
      <div className="section-top"><h3>转化拆分</h3><span className="legacy-tag">旧统计方式 · v1</span></div>
      <p className="split-legacy-note">该研究按旧口径保存：直接路径的转化被一并摊入渠道移除效应归一，观察到的 {number(result.conversions)} 个转化已全部分配给渠道（direct_paths={result.direct_paths}）。结果保持原值不再重算，仅新建研究会采用“直接转化单列”的 v2 口径。</p>
      <div className="split-row">
        <div><span>观察转化（旧口径全量归一）</span><b>{number(result.conversions)}</b><small>渠道归因合计 = {number(result.credits.reduce((n,c)=>n+c.credited_conversions,0))}</small></div>
      </div>
    </section>;
  }
  const direct=result.direct_conversions??0;
  const touched=result.touched_conversions??result.conversions;
  const credited=result.credited_conversions_total??result.credits.reduce((n,c)=>n+c.credited_conversions,0);
  const identity=Math.abs((direct+credited)-result.conversions)<1e-6;
  return <section className="conversion-split">
    <div className="section-top">
      <h3>观察转化拆分</h3>
      <span>{result.budget_eligible?'可生成预算情景':'无带触点转化 · 不生成预算建议'}</span>
    </div>
    <div className="split-grid">
      <div className="split-cell direct">
        <span>直接转化（无渠道触点）</span>
        <b>{number(direct)}</b>
        <small>直接路径 {number(result.direct_paths)} 条 · 其中NULL {number(result.direct_null_paths??0)} 条</small>
        <small>单列，不计入任何渠道份额或关联得分</small>
      </div>
      <div className="split-eq">+</div>
      <div className="split-cell touched">
        <span>带触点转化（渠道归因覆盖）</span>
        <b>{number(touched)}</b>
        <small>带触点路径 {number(result.touched_journey_count??0)} 条</small>
        <small>渠道归因合计 {number(credited)} · 份额和 {percent(result.credits.reduce((n,c)=>n+c.share,0))}</small>
      </div>
      <div className="split-eq">=</div>
      <div className="split-cell observed">
        <span>观察转化总数</span>
        <b>{number(result.conversions)}</b>
        <small>观察转化率 {percent(result.observed_conversion_rate??0)}</small>
        <small className={identity?'split-ok':'split-bad'}>{identity?'拆分恒等式成立':'拆分不平，请复核'}</small>
      </div>
    </div>
    {result.direct_note&&<p className="caption">{result.direct_note}</p>}
  </section>;
}
