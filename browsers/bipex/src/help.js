import React from 'react'

const help = {
  geneResult: {
    title: 'Gene Burden Result',
    render: () => (
      <React.Fragment>
        <p>
          These tables display the case-control burden of classes of variation within the gene of
          interest. By clicking on the tabs, you can jump between the entire case-control cohort and
          subphenotypes.
        </p>
        <p>
          Counts in the tables denote the summation of all minor allele count (MAC) &le; 5 variants
          with that class of variation across the currently selected case cohort and controls
          respectively. We include two tables. The first is the overall count of MAC&le;5 without
          restriction to those variants not observed in a large control repository, the second
          applies a further restriction that the MAC&le;5 variant must not be present in the genome
          aggregation database (gnomAD). PTV stands for protein truncating variants, and we define
          damaging missense variants as missense variants that are classed as ‘probably damaging’ by
          polyphen, and ‘deleterious’ by SIFT.
        </p>
        <p>
          p-values are evaluated using Fisher’s exact and Cochran–Mantel–Haenszel (CMH) tests (a
          contingency based test allowing for case-control counts across distinct strata (cohorts
          grouped by geography in our case) in the data). Note that these p-values are evaluated on
          contingency tables based on presence/absence of a class of variation in the gene, not
          overall burden.
        </p>
      </React.Fragment>
    ),
  },
}

export default help
