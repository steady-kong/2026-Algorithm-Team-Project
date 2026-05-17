from enum import Enum


class BrewMethod(str, Enum):
    HAND_DRIP = "hand_drip"
    MOKA_POT = "moka_pot"
    ESPRESSO_MACHINE = "espresso_machine"
    AEROPRESS = "aeropress"
    FRENCH_PRESS = "french_press"
