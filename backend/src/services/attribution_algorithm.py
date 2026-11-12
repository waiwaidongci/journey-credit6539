from .transition_algorithm import transition_matrix,direct_only_matrix
from .absorbing_algorithm import absorption_probability,remove_to_null
from ..utils.fingerprint import fingerprint

METHOD_VERSION="absorbing-null-removal-v2-direct-split"

def analyze_attribution(batch,journeys,channels):
    journeys=sorted(journeys,key=lambda j:j['code']);channels=sorted(channels,key=lambda c:c['code'])
    if len({j['code'] for j in journeys})!=len(journeys):raise ValueError("匿名路径编号重复")
    codes=[c['code'] for c in channels]
    # 拆分：直接路径（无渠道触点）与带触点路径；渠道归因只覆盖后者。
    direct=[j for j in journeys if not j['path']]
    touched=[j for j in journeys if j['path']]
    total_conversions=sum(j['converted'] for j in journeys)
    direct_conversions=sum(j['converted'] for j in direct)
    direct_nulls=len(direct)-direct_conversions
    touched_conversions=sum(j['converted'] for j in touched)
    if total_conversions!=direct_conversions+touched_conversions:raise ValueError("转化拆分不平：直接与带触点转化之和须等于观察转化")

    if not touched:
        # 全直接批次：研究可完成并保存观察结果，但不存在渠道效应，不生成预算建议。
        states,counts,matrix=direct_only_matrix(codes)
        credit=[{**c,"removed_probability":0.,"removal_effect":0.,"touches":0,"last_touch_conversions":0,
                 "share":0.,"credited_conversions":0.,"association_score":0.} for c in channels]
        base=0.
    else:
        states,counts,matrix=transition_matrix(touched,codes)
        base=absorption_probability(matrix,states)
        credit=[]
        for c in channels:
            if base<=1e-12:
                removed=0.
            else:
                removed=absorption_probability(remove_to_null(matrix,states,c['code']),states)
            effect=max(0.,(base-removed)/base) if base>1e-12 else 0.
            touches=sum(j['path'].count(c['code']) for j in touched)
            last=sum(j['converted'] and bool(j['path']) and j['path'][-1]==c['code'] for j in touched)
            credit.append({**c,"removed_probability":removed,"removal_effect":effect,"touches":touches,"last_touch_conversions":last})
        total_effect=sum(c['removal_effect'] for c in credit)
        if touched_conversions>0 and total_effect<=1e-12:raise ValueError("带触点转化存在但所有渠道移除效应为零，不能归一归因")
        for c in credit:
            # 份额与归因转化数只在带触点转化内部归一，直接转化不摊入任何渠道。
            c['share']=c['removal_effect']/total_effect if total_effect>1e-12 else 0.
            c['credited_conversions']=c['share']*touched_conversions
            c['association_score']=c['credited_conversions']/c['touches'] if c['touches'] else 0.

    credited_total=sum(c['credited_conversions'] for c in credit)
    if abs(credited_total-touched_conversions)>1e-8:raise ValueError("渠道归因合计与带触点转化不一致")
    budget_eligible=bool(touched) and touched_conversions>0 and sum(c['association_score'] for c in credit)>1e-12
    info={"id":batch.id,"name":batch.name,"source":batch.source}
    return {
        "method_version":METHOD_VERSION,
        "batch":info,"journey_count":len(journeys),
        "conversions":total_conversions,
        "direct_paths":len(direct),
        "direct_conversions":direct_conversions,
        "direct_null_paths":direct_nulls,
        "touched_journey_count":len(touched),
        "touched_conversions":touched_conversions,
        "credited_conversions_total":credited_total,
        "budget_eligible":budget_eligible,
        "base_probability":base,
        "observed_conversion_rate":(total_conversions/len(journeys)) if journeys else 0.,
        "states":states,"transition_counts":counts.tolist(),"transition_matrix":matrix.tolist(),
        "credits":credit,
        "input_hash":fingerprint({"method":METHOD_VERSION,"batch":info,"journeys":journeys,"channels":channels}),
        "removal_policy":"所有指向被移除渠道的概率流量转入NULL；被移除渠道本身转NULL，不跨接路径，其他行保持和1。",
        "assumptions":"一阶马尔可夫、观察期路径闭合且渠道定义一致；移除效应是关联模型，不是因果增量。循环触点保留，未访问渠道转NULL且归因零。",
        "normalization":"直接转化单列且不参与渠道归一；相对移除效应仅按带触点路径归一，渠道归因转化数合计=带触点转化，加上直接转化等于观察转化总数。全直接批次无渠道效应，不生成预算建议。",
        "direct_note":"直接预约没有任何渠道触点，其转化不计入渠道功劳或关联得分；预算情景仅基于带触点路径的归因。",
    }
