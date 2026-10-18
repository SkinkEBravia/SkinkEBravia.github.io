/** CV facts from Resume_Yifan_Zhang_1016; page-only OCR results from the September experiment reports. */

export interface MetricColumn {
  key: "median" | "p90" | "max" | "fixed" | "broken";
  label: string;
  higher?: boolean;
}

export interface MetricRow {
  edit: string;
  arm: string;
  median: number;
  p90: number;
  max: number;
  fixed: number;
  broken: number;
  spans: number;
  tokens: string;
  status: string;
}

/** Page-only results transcribed from the September experiment reports. */
export interface MetricTable {
  columns: MetricColumn[];
  batches: { id: string; model: string; date: string; rows: MetricRow[]; note: string }[];
  setup: string;
  observation: string;
  limitation: string;
}

export interface ResumeEntry {
  title: string;
  when: string;
  context: string[];
  points: string[];
  note?: string;
  table?: MetricTable;
}

export interface ResumeHonor {
  title: string;
  when: string;
}

export interface ResumeSkill {
  label: string;
  value: string;
}

export const resume = {
  name: "Yifan Zhang",
  phone: "+86 17721379323",
  phoneHref: "tel:+8617721379323",
  email: "yifanz2027@126.com",
  updated: "Oct 2026",
  education: {
    title: "Lanzhou University",
    when: "Aug. 2023 – Jul. 2027",
    context: ["Gansu, China", "Bachelor of Engineering", "Major: Artificial Intelligence", "Cumulative GPA: 88.1/100"],
    interest:
      "LLM agents, tool-use interfaces, controllable content editing; applications in AIGC, computer graphics, and 3D computer vision.",
  },
  publication: {
    citation:
      "Discrete-Time Neural Dynamics-Based Online Quadratic Programming for Discrete-Time Trajectory Tracking of Cable-Driven Planar Robot, Weicheng Xu, Yuhui Bao, Yifan Zhang, Jianfeng Lv, Neural Networks, 2027, Volume 205, Part A, 109368.",
    doi: "10.1016/j.neunet.2026.109368",
    href: "https://www.sciencedirect.com/science/article/pii/S0893608026008270",
  },
  research: [
    {
      title:
        "Explicitly-Addressable Agent Document Editing Interfaces for LLM-Assisted OCR Post-Correction for Multilingual Historical Documents",
      when: "Jul. – Aug. 2026",
      context: ["Independent Research Based on HIPE-OCRepair 2026"],
      points: [
        "Developed and evaluated an LLM-agent interface with stable-ID local editing primitives for historical-document OCR post-correction on HIPE-OCRepair-Bench.",
        "Built a document IR and content-addressable snapshot system supporting atomic edits, auditable action logs, and deterministic replay without additional API calls.",
        "Compared eight interface variants on the dta19 German subset. Stable-ID local editing reduced P90 cMER from 0.0564 to 0.0199 versus global find/replace with an identical view, with unchanged median performance. Also identified a presentation confounder: adding line numbers alone reduced the correction rate by 10.3 percentage points.",
      ],
      table: {
        "columns": [
          {
            "key": "median",
            "label": "Median cMER"
          },
          {
            "key": "p90",
            "label": "P90"
          },
          {
            "key": "max",
            "label": "Max"
          },
          {
            "key": "fixed",
            "label": "Fixed",
            "higher": true
          },
          {
            "key": "broken",
            "label": "Broken"
          }
        ],
        "batches": [
          {
            "id": "v4",
            "model": "DeepSeek V4 Flash",
            "date": "2026-09-08",
            "rows": [
              {
                "edit": "Global find/replace",
                "arm": "find-replace",
                "median": 0.0096,
                "p90": 0.0272,
                "max": 0.0605,
                "fixed": 61.3,
                "broken": 0.46,
                "spans": 254.5,
                "tokens": "2.12M",
                "status": "33 done"
              },
              {
                "edit": "Global find/replace + keys",
                "arm": "fr-numkey",
                "median": 0.0087,
                "p90": 0.0564,
                "max": 0.0659,
                "fixed": 51.0,
                "broken": 0.39,
                "spans": 218.2,
                "tokens": "2.13M",
                "status": "33 done"
              },
              {
                "edit": "Blocked find/replace",
                "arm": "fr-blocked",
                "median": 0.0109,
                "p90": 0.0587,
                "max": 0.0659,
                "fixed": 48.0,
                "broken": 0.38,
                "spans": 224.7,
                "tokens": "2.58M",
                "status": "33 done"
              },
              {
                "edit": "Local patch",
                "arm": "patch-find-replace",
                "median": 0.0084,
                "p90": 0.0199,
                "max": 0.0295,
                "fixed": 65.8,
                "broken": 0.52,
                "spans": 350.5,
                "tokens": "2.35M",
                "status": "33 done"
              },
              {
                "edit": "Local patch · no attention",
                "arm": "pfr-noatt",
                "median": 0.0089,
                "p90": 0.0197,
                "max": 0.0621,
                "fixed": 63.7,
                "broken": 0.47,
                "spans": 317.7,
                "tokens": "2.11M",
                "status": "33 done"
              },
              {
                "edit": "Local patch · unstable keys",
                "arm": "pfr-unstable",
                "median": 0.0104,
                "p90": 0.0253,
                "max": 0.0444,
                "fixed": 59.5,
                "broken": 0.46,
                "spans": 303.2,
                "tokens": "2.39M",
                "status": "33 done"
              },
              {
                "edit": "Full rewrite",
                "arm": "rewrite",
                "median": 0.012,
                "p90": 0.0389,
                "max": 0.9648,
                "fixed": 67.4,
                "broken": 3.86,
                "spans": 343.8,
                "tokens": "1.88M",
                "status": "33 done"
              },
              {
                "edit": "Full rewrite + keys",
                "arm": "rewrite-numkey",
                "median": 0.011,
                "p90": 0.0248,
                "max": 0.0322,
                "fixed": 69.7,
                "broken": 0.82,
                "spans": 377.6,
                "tokens": "2.59M",
                "status": "33 done"
              }
            ],
            "note": "All runs completed. No key leakage was observed in any of the eight variants."
          },
          {
            "id": "v41",
            "model": "DeepSeek V4.1 Flash",
            "date": "2026-09-18",
            "rows": [
              {
                "edit": "Global find/replace",
                "arm": "find-replace",
                "median": 0.0101,
                "p90": 0.023,
                "max": 0.0582,
                "fixed": 58.9,
                "broken": 0.44,
                "spans": 304.9,
                "tokens": "1.43M (88%r)",
                "status": "33 done"
              },
              {
                "edit": "Global find/replace + keys",
                "arm": "find-replace-numkey",
                "median": 0.0097,
                "p90": 0.0248,
                "max": 0.0479,
                "fixed": 58.0,
                "broken": 0.49,
                "spans": 321.7,
                "tokens": "1.47M (86%r)",
                "status": "33 done"
              },
              {
                "edit": "Blocked find/replace",
                "arm": "find-replace-blocked",
                "median": 0.0105,
                "p90": 0.0193,
                "max": 0.0308,
                "fixed": 60.2,
                "broken": 0.36,
                "spans": 320.2,
                "tokens": "1.46M (87%r)",
                "status": "33 done"
              },
              {
                "edit": "Local patch",
                "arm": "patch-find-replace",
                "median": 0.0078,
                "p90": 0.0187,
                "max": 0.0284,
                "fixed": 60.3,
                "broken": 0.37,
                "spans": 338.0,
                "tokens": "1.47M (87%r)",
                "status": "32 done · 1 budget"
              },
              {
                "edit": "Local patch · no attention",
                "arm": "patch-find-replace-noatt",
                "median": 0.0094,
                "p90": 0.0183,
                "max": 0.0276,
                "fixed": 61.0,
                "broken": 0.41,
                "spans": 340.5,
                "tokens": "1.31M (83%r)",
                "status": "33 done"
              },
              {
                "edit": "Local patch · unstable keys",
                "arm": "patch-find-replace-unstable",
                "median": 0.0094,
                "p90": 0.0232,
                "max": 0.0605,
                "fixed": 56.4,
                "broken": 0.33,
                "spans": 267.0,
                "tokens": "1.46M (86%r)",
                "status": "31 done · 2 budget"
              },
              {
                "edit": "Full rewrite",
                "arm": "rewrite",
                "median": 0.0104,
                "p90": 0.0245,
                "max": 0.0605,
                "fixed": 65.0,
                "broken": 0.65,
                "spans": 304.8,
                "tokens": "985k (84%r)",
                "status": "33 done"
              },
              {
                "edit": "Full rewrite + keys",
                "arm": "rewrite-numkey",
                "median": 0.0119,
                "p90": 0.0245,
                "max": 0.7483,
                "fixed": 65.4,
                "broken": 9.91,
                "spans": 390.8,
                "tokens": "1.25M (84%r)",
                "status": "33 done"
              }
            ],
            "note": "Three runs reached the budget limit (one local patch, two unstable-key patches); their available outputs are included in the scores. Full rewrite + keys leaked 244 key occurrences in one of 33 tasks. Output-token figures include reasoning; the parenthesized share is reasoning."
          }
        ],
        "setup": "The same 33 paired tasks: 11 German DTA19 source documents at three noise levels, one model turn per task, and eight interface variants per version. Both versions used the same endpoint, protocol, and generation parameters. The no-edit median cMER was 0.0238 in both batches.",
        "observation": "Across two DeepSeek Flash versions, local patching showed lower observed P90 and maximum cMER than full rewriting on the same 33 tasks. The no-attention patch variant had slightly lower P90 and maximum cMER than the standard local patch in V4.1; attention was not uniformly beneficial.",
        "limitation": "Exploratory results from 11 source documents and two versions of one model family. Tail statistics are descriptive and do not establish a statistically significant tail-risk reduction. Scores use document-level aggregation rather than official leaderboard scoring. Fixed is the correction rate; broken measures damage to previously correct text. Output tokens are totals per interface variant."
      },
    },
    {
      title: "Improving the Efficiency of PCFT (Physics-Constrained Flow Matching)",
      when: "Apr. – Jul. 2026",
      context: ["Undergraduate Researcher"],
      points: [
        "Removed redundant forward computations, reducing adjoint-matching latency by 21.5% and increasing throughput by 27.4% on Darcy while preserving bit-identical outputs under a fixed seed.",
        "Implemented LoRA adapters for the U-FNO backbone, including complex-valued adapters for FNO spectral weights, to test whether drift corrections could be learned through low-rank updates.",
        "Ablated adapter placement: correction-head-only updates barely improved the weak PDE residual (4.687 → 4.638), while adapters within the frozen pretrained operator achieved 2.381 versus 2.485 for full fine-tuning, using 3.02M versus 25.8M trainable parameters.",
      ],
    },
    {
      title:
        "Discrete-Time Neural Dynamics-Based Online Quadratic Programming for Discrete-Time Trajectory Tracking of Cable-Driven Planar Robot",
      when: "Jan. – Jul. 2026",
      context: ["Co-Author"],
      points: [
        "Helped formulate inverse-kinematics tracking as an online least-squares QP in cable-rate space, using a discrete-time reference velocity toward the next sampled target instead of the trajectory's analytical derivative.",
        "Implemented sampled-data control and cable-rate-to-motor-step conversion; conducted simulations and hardware experiments on a two-cable V-plotter, benchmarking against ID-DTRNN under noise-free and disturbed conditions across three sampling intervals.",
      ],
    },
    {
      title: "MIT xPRO's Online Program - Geometric Prior Initialization for Text-to-3D Generation",
      when: "Dec. 2023 – Aug. 2024",
      context: [],
      points: [
        "Combined DreamGaussian with computer vision techniques and CG post-processing to build a 3D-asset generation pipeline for Nendoroid figures, addressing fidelity issues of early text-to-3D models for generating animation-ready static CG assets.",
        "Modified the point-cloud initialization in an open-source text-to-3D Gaussian Splatting pipeline, seeding it from alpha-masked reference images instead of the default spherical distribution; the first ~100 optimization steps converged noticeably faster.",
      ],
    },
  ] satisfies ResumeEntry[],
  competitions: [
    {
      title:
        "Multi-Physics Stochastic Hybrid Model-X2 (MP-SHM-X2): A Continuous-Time Framework for Smartphone Battery SOC and Time-to-Empty (TTE) Prediction",
      when: "Jan. – Feb. 2026",
      context: ["2026 MCM/ICM", "Team Member"],
      points: [
        "Implemented the entire computational pipeline for a team-designed continuous-time stochastic model of smartphone battery discharge: ODE/SDE integration for a second-order Thevenin circuit coupled to a two-node thermal model with temperature-dependent internal resistance, and Markov sampling of user-activity modes driving the load process.",
        "Built the Monte Carlo scenario generation, parameter calibration, sensitivity and residual analyses, and visualization across initial charge levels, workload mixes, and ambient temperatures; the model reached a blind-test SOC NRMSE of about 1.82%.",
      ],
    },
    {
      title:
        "National Second Prize & Northwest Regional First Prize in China Collegiate Computing Contest 2025 Mobile Application Innovation Competition",
      when: "Apr. – Nov. 2025",
      context: ["Backend Development"],
      points: [
        "Built the scheduling backend around Google OR-Tools CP-SAT, modeling recurring tasks, mandatory versus optional tasks, priorities, scheduling windows, and reserved rest periods as solver constraints; solving runs server-side, keeping the mobile client thin.",
        "Designed a unified task-metadata abstraction that decouples task sources from scheduling logic, so heterogeneous inputs become one constraint representation and adding a new source - natural-language task input, for instance - needs no change to the scheduling model.",
      ],
    },
    {
      title: "National First Prize in 2025 RAICOM Robot Developer Competition",
      when: "May – Aug. 2025",
      context: ["Code Development"],
      points: [
        "Led development of a hands-on tutorial codebase for BERT-based Chinese named-entity recognition: modular training and inference code behind a centralized configuration block, with runtime dependencies pinned under native pip so that readers running it themselves would not hit version-conflict failures.",
      ],
    },
  ] satisfies ResumeEntry[],
  internship: {
    title: "VKing Intelligence, high-precision spatial real-scene 3D AIoT solutions provider",
    when: "Jul. – Aug. 2025",
    context: ["Shanghai, China", "Algorithm Intern"],
    points: [
      "Worked on object segmentation for billion-scale UAV-LiDAR substation point clouds in 3D digital-twin reconstruction; reproduced PointNet and compared it against classical geometric point-cloud pipelines.",
    ],
  } satisfies ResumeEntry,
  honors: [
    { title: "Honorable Mention, Mathematical Contest in Modeling (MCM)", when: "2026" },
    {
      title:
        "Second Prize (National Level), China Collegiate Computing Contest 2025 Mobile Application Innovation Competition (Enlightenment Track, Higher-Education Group)",
      when: "Nov. 2025",
    },
    {
      title:
        "First Prize (National Level), Zhihai Artificial Intelligence Algorithm Application Competition, 2025 RAICOM Robot Developer Competition",
      when: "Aug. 2025",
    },
    {
      title:
        "First Prize (Northwest Division), China Collegiate Computing Contest 2025 Mobile Application Innovation Competition (Enlightenment Track)",
      when: "Aug. 2025",
    },
    { title: "Bronze Award, 2024 ICPC China Northwest Provincial Programming Contest", when: "Mar. 2024" },
  ] satisfies ResumeHonor[],
  skills: [
    { label: "Programming Languages", value: "Python" },
    { label: "Languages", value: "Mandarin, English (IELTS 7.5)" },
    { label: "Optimization", value: "Google OR-Tools CP-SAT, constraint programming, quadratic programming" },
    { label: "Tooling", value: "uv, pytest, Git; WSL / Linux; single-GPU training on rented compute" },
    {
      label: "Machine Learning",
      value:
        "PyTorch; flow matching and diffusion models, LoRA and parameter-efficient fine-tuning, stochastic optimal control fine-tuning (Adjoint Matching), LLM agents and tool-use harnesses",
    },
  ] satisfies ResumeSkill[],
} as const;
