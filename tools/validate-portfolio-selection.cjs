'use strict';
// Current editorial selection. A rejected presentation cannot silently re-enter
// through a source catalog, technical map, evidence sample or a future rebuild.
const withdrawn=/(?:halveth-(?:unreal|realms|morrowind-genesis)|ashbound|scene-astralis|portal garden|scarlet garden|5c2260f85d5275c15082c5c7d38ae51a143a5688)/i;
function validatePortfolioSelection(value){
 if(withdrawn.test(JSON.stringify(value)))throw Error('Withdrawn game presentation is outside the current portfolio selection');
 return value;
}
module.exports={validatePortfolioSelection};
