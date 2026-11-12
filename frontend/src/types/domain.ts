export interface User{name:string;email:string;role:string}
export interface Batch{id:number;name:string;source:string;description:string;journey_count:number;conversions:number}
export interface Journey{id:number;code:string;batch_id:number;path:string[];converted:boolean;note:string}
export interface Channel{id:number;code:string;name:string;unit_cost:number;capacity:number;description:string}
export interface Credit extends Channel{share:number;credited_conversions:number;removal_effect:number;removed_probability:number;touches:number;last_touch_conversions:number;association_score:number}
export interface AttributionResult{batch:Batch;journey_count:number;conversions:number;base_probability:number;states:string[];transition_counts:number[][];transition_matrix:number[][];credits:Credit[];input_hash:string;removal_policy:string;assumptions:string;normalization:string;direct_paths:number;
  method_version?:string;
  direct_conversions?:number;
  direct_null_paths?:number;
  touched_journey_count?:number;
  touched_conversions?:number;
  credited_conversions_total?:number;
  budget_eligible?:boolean;
  observed_conversion_rate?:number;
  direct_note?:string;
  legacy_stats?:boolean}
export function isLegacyResult(r:AttributionResult):boolean{return !r.method_version || r.legacy_stats===true}
export function directConversionsOf(r:AttributionResult):number{return isLegacyResult(r)?r.direct_paths:r.direct_conversions??0}
export function touchedConversionsOf(r:AttributionResult):number{return isLegacyResult(r)?r.conversions:r.touched_conversions??r.conversions}
export interface Run{id:number;name:string;batch_id:number;status:string;result:AttributionResult;error:string;owner:string;created_at:string}
export interface Allocation{code:string;name:string;allocation:number;unit_cost:number;capacity:number;spend:number;association_score:number;proxy_contribution:number;share:number}
export interface Scenario{id:number;name:string;run_id:number;budget:number;capacity_overrides:Record<string,number>;status:string;review_status:string;result:{allocations:Allocation[];budget:number;spent:number;unspent:number;objective:number;solver:string;assumptions:string;input_hash:string;attribution_hash:string};error:string;owner:string;reviewer:string;review_note:string;created_at:string}
export interface Audit{id:number;actor:string;action:string;target:string;created_at:string}
