# Domain Constants for VARUNA-RAINFALL

REGIMES = [
    "active",
    "break",
    "depression",
    "coastal",
    "orographic",
    "western_disturbance"
]

IMD_THRESHOLDS = {
    "heavy": 64.5,
    "very_heavy": 115.6,
    "extremely_heavy": 204.5
}

FALLBACK_LADDER = [
    "REGIME_AWARE",
    "POOLED_GLOBAL",
    "QM",
    "RAW_NWP",
    "ABSTAIN"
]

CALIBRATION_STATES = [
    "GREEN",
    "AMBER",
    "ABSTAIN"
]

CORRECTION_METHODS = {
    "active": "active_emos",
    "break": "break_qm",
    "depression": "lps_frequency_match",
    "coastal": "coastal_analog",
    "orographic": "terrain_qm",
    "western_disturbance": "wd_recalibration",
    "blend": "probability_blend"
}

DISCLAIMER_TEXT = "Decision support — not an official warning authority. Synthetic prototype data — not operational forecast skill."
