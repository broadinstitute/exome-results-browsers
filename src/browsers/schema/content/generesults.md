# Gene results description [question mark]

This table displays aggregated case-control and _de novo_ counts for the purposes of gene discovery. We first enriched for pathogenic variants by restricting our analysis to ultra-rare protein-coding variants (defined as minor allele count [MAC] ≤ 5) in our data set.  

Given empirically observed exome-wide burden, we focused on protein-truncating or putatively loss-of-function variants (PTVs), defined as stop-gained, frameshift, and essential splice donor or acceptor variants. We additionally analyzed damaging missense variants as prioritized by the MPC pathogenicity score (see [Samocha _et al_. 2017](https://www.biorxiv.org/content/10.1101/148353v1)).   

PTVs and MPC > 3 missense variants (defined as Class I variants) were jointly analyzed in a single case-control burden test. MPC 2 - 3 variants (defined as Class II variants) were analyzed in a separate burden test before meta-analyzed with the Class I burden P-value using Stouffer's weighted Z-score method. Case-control significance was evaluated using a permutation-based Fisher's Exact Test. For genes with case-control P-value < 0.01, _de novo_ Class I and II P values were calculated using the Poisson rate test and meta-analyzed with our case-control test statistic using a Stouffer's weighted Z-score method. The Q-value is the P-value adjusted for the False Discovery Rate.

For a full description and justification of the approach, please consider the main text and supplementary materials and methods of the SCHEMA pre-print manuscript.  