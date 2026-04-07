import ASCGeneResults from './asc/ASCGeneResults'
// import BipExGeneResults from './bipex/BipExGeneResults'
import BipEx2GeneResults from './bipex2/BipEx2GeneResults'
import Epi25GeneResults from './epi25/Epi25GeneResults'
import SCHEMAGeneResults from './schema/SCHEMAGeneResults'
import SCHEMA2GeneResults from './schema2/SCHEMA2GeneResults'
import IBDGeneResults from './ibd/IBDGeneResults'
import GP2GeneResults from './gp2/GP2GeneResults'

export default {
  ASC: ASCGeneResults,
  // BipEx: BipExGeneResults,
  BipEx2: BipEx2GeneResults,
  Epi25: Epi25GeneResults,
  SCHEMA: SCHEMAGeneResults,
  SCHEMA2: SCHEMA2GeneResults,
  IBD: IBDGeneResults,
  GP2: GP2GeneResults,
}
