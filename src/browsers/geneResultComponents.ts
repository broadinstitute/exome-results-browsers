import ASCGeneResults from './asc/ASCGeneResults'
import ASC2GeneResults from './asc2/ASC2GeneResults'
// import BipExGeneResults from './bipex/BipExGeneResults'
import BipEx2GeneResults from './bipex2/BipEx2GeneResults'
import Epi25GeneResults from './epi25/Epi25GeneResults'
import SCHEMAGeneResults from './schema/SCHEMAGeneResults'
import IBDGeneResults from './ibd/IBDGeneResults'
import GP2GeneResults from './gp2/GP2GeneResults'

export default {
  ASC: ASCGeneResults,
  ASC2: ASC2GeneResults,
  // BipEx: BipExGeneResults,
  BipEx2: BipEx2GeneResults,
  Epi25: Epi25GeneResults,
  SCHEMA: SCHEMAGeneResults,
  IBD: IBDGeneResults,
  GP2: GP2GeneResults,
}
