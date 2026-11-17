/* Fixed model clock. Whole-step debt is retained under overload. */
(()=>{'use strict';
 const create=({stepSeconds=1/90,maxStepsPerFrame=240,onStep=()=>{}}={})=>{
  if(!Number.isFinite(stepSeconds)||stepSeconds<=0||!Number.isInteger(maxStepsPerFrame)||maxStepsPerFrame<1)throw new RangeError('Invalid fixed-clock configuration');
  let steps=0,backlogSeconds=0;
  const snapshot=()=>({steps,modelTime:steps*stepSeconds,backlogSeconds,overloaded:backlogSeconds+stepSeconds*1e-9>=stepSeconds});
  return{snapshot,restore(state){if(!state||!Number.isInteger(state.steps)||state.steps<0||!Number.isFinite(state.backlogSeconds)||state.backlogSeconds<0)throw new RangeError('Invalid clock snapshot');steps=state.steps;backlogSeconds=state.backlogSeconds;return snapshot();},reset(){steps=0;backlogSeconds=0;return snapshot();},advance(deltaSeconds){
   if(!Number.isFinite(deltaSeconds)||deltaSeconds<0)throw new RangeError('Invalid elapsed model time');
   backlogSeconds+=deltaSeconds;let consumed=0;
   while(backlogSeconds+stepSeconds*1e-9>=stepSeconds&&consumed<maxStepsPerFrame){
    onStep(stepSeconds,steps*stepSeconds,steps+1);steps++;consumed++;backlogSeconds-=stepSeconds;
    // Only sub-roundoff negative debt is normalized; no positive elapsed time is discarded.
    if(backlogSeconds<0&&backlogSeconds>-stepSeconds*1e-9)backlogSeconds=0;
   }
   return snapshot();
  }};
 };
 globalThis.HALVETHFixedClock=Object.freeze({create});
})();
