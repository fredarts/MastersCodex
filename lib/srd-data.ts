import { SRDMonster, SRDSpell, SRDItem, Encounter, LoreNode, BGMTrack, SFXButton, ConditionType } from './types';

export const CONDITIONS: ConditionType[] = [
  'Cego',
  'Encantado',
  'Surdo',
  'Atemorizado',
  'Agarrado',
  'Incapacitado',
  'Invisível',
  'Paralisado',
  'Petrificado',
  'Envenenado',
  'Caído',
  'Restrito',
  'Inconsciente',
  'Concentração',
];

export const INITIAL_MONSTERS: SRDMonster[] = [
  {
    "name": "Aboleth",
    "type": "Aberração",
    "size": "Grande",
    "alignment": "Leal e Mau",
    "ac": 17,
    "hp": 135,
    "speed": "3 m, swim: 12 m",
    "cr": "10",
    "xp": 5900,
    "str": 21,
    "dex": 9,
    "con": 15,
    "int": 18,
    "wis": 15,
    "cha": 18,
    "abilities": [
      {
        "name": "Amphibious",
        "desc": "The aboleth can breathe air and water."
      },
      {
        "name": "Mucous Cloud",
        "desc": "While underwater, the aboleth is surrounded by transformative mucus. A creature that touches the aboleth or that hits it with a melee attack while within 5 metros of it must make a CD 14 Constitution teste de resistência. On a failure, the creature is diseased for 1d4 hours. The diseased creature can breathe only underwater."
      },
      {
        "name": "Probing Telepathy",
        "desc": "If a creature communicates telepathically with the aboleth, the aboleth learns the creature's greatest desires if the aboleth can see the creature."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The aboleth makes three tentacle attacks."
      },
      {
        "name": "Tentacle",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 10 metros, um alvo. Hit: 12 (2d6 + 5) dano de concussão. If the target is a creature, it must succeed on a CD 14 Constitution teste de resistência or become diseased. The disease has no effect for 1 minute and can be removed by any magic that cures disease. After 1 minute, the diseased creature's skin becomes translucent and slimy, the creature can't regain hit points unless it is underwater, and the disease can be removed only by heal or another disease-curing spell of 6th level or higher. When the creature is outside a body of water, it takes 6 (1d12) dano de ácido every 10 minutes unless moisture is applied to the skin before 10 minutes have passed."
      },
      {
        "name": "Tail",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 10 metros, um alvo. Hit: 15 (3d6 + 5) dano de concussão."
      },
      {
        "name": "Enslave",
        "desc": "The aboleth targets one creature it can see within 30 metros of it. The target must succeed on a CD 14 Wisdom teste de resistência or be magically charmed by the aboleth until the aboleth dies or until it is on a different plane of existence from the target. The charmed target is under the aboleth's control and can't take reactions, and the aboleth and the target can communicate telepathically with each other over any distance.\nWhenever the charmed target takes damage, the target can repeat the teste de resistência. On a success, the effect ends. No more than once every 24 hours, the target can also repeat the teste de resistência when it is at least 1 mile away from the aboleth."
      }
    ],
    "id": "aboleth",
    "tokenImageUrl": "/assets/2d/Monstros/Aboleth.png",
    "tokenType": "billboard"
  },
  {
    "name": "Alma Penada",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Neutro e Mau",
    "ac": 13,
    "hp": 67,
    "speed": "0 m, fly: 18 m, hover: true",
    "cr": "5",
    "xp": 1800,
    "str": 6,
    "dex": 16,
    "con": 16,
    "int": 12,
    "wis": 14,
    "cha": 15,
    "abilities": [
      {
        "name": "Incorporeal Movement",
        "desc": "The wraith can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) dano de força if it ends its turn inside an object."
      },
      {
        "name": "Sunlight Sensitivity",
        "desc": "While in sunlight, the wraith has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Life Drain",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, one creature. Hit: 21 (4d8 + 3) dano necrótico. The target must succeed on a CD 14 Constitution teste de resistência or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      },
      {
        "name": "Create Specter",
        "desc": "The wraith targets a humanoid within 10 feet of it that has been dead for no longer than 1 minute and died violently. The target's spirit rises as a specter in the space of its corpse or in the nearest unoccupied space. The specter is under the wraith's control. The wraith can have no more than seven specters under its control at one time."
      }
    ],
    "id": "alma-penada",
    "tokenImageUrl": "/assets/2d/Monstros/Alma Penada.png",
    "tokenType": "billboard"
  },
  {
    "name": "Androesfinge",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Leal e Neutro",
    "ac": 17,
    "hp": 199,
    "speed": "12 m, fly: 18 m",
    "cr": "17",
    "xp": 18000,
    "str": 22,
    "dex": 10,
    "con": 20,
    "int": 16,
    "wis": 18,
    "cha": 23,
    "abilities": [
      {
        "name": "Inscrutable",
        "desc": "The sphinx is immune to any effect that would sense its emotions or read its thoughts, as well as any divination spell that it refuses. Wisdom (Insight) checks made to ascertain the sphinx's intentions or sincerity have disadvantage."
      },
      {
        "name": "Magic Weapons",
        "desc": "The sphinx's weapon attacks are magical."
      },
      {
        "name": "Spellcasting",
        "desc": "The sphinx is a 12th-level spellcaster. Its spellcasting ability is Wisdom (spell save CD 18, +10 para acertar with spell attacks). It requires no material components to cast its spells. The sphinx has the following cleric spells prepared:\n\n- Cantrips (at will): sacred flame, spare the dying, thaumaturgy\n- 1st level (4 slots): command, detect evil and good, detect magic\n- 2nd level (3 slots): lesser restoration, zone of truth\n- 3rd level (3 slots): dispel magic, tongues\n- 4th level (3 slots): banishment, freedom of movement\n- 5th level (2 slots): flame strike, greater restoration\n- 6th level (1 slot): heroes' feast"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The sphinx makes two claw attacks."
      },
      {
        "name": "Claw",
        "desc": "Ataque Corpo-a-Corpo com Arma: +12 para acertar, alcance 5 metros, um alvo. Hit: 17 (2d10 + 6) dano cortante."
      },
      {
        "name": "Roar",
        "desc": "The sphinx emits a magical roar. Each time it roars before finishing a long rest, the roar is louder and the effect is different, as detailed below. Each creature within 500 feet of the sphinx and able to hear the roar must make a teste de resistência.\n\nFirst Roar. Each creature that fails a CD 18 Wisdom teste de resistência is frightened for 1 minute. A frightened creature can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success.\n\nSecond Roar. Each creature that fails a CD 18 Wisdom teste de resistência is deafened and frightened for 1 minute. A frightened creature is paralyzed and can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success.\n\nThird Roar. Each creature makes a CD 18 Constitution teste de resistência. On a failed save, a creature takes 44 (8d10) dano trovejante and is knocked prone. On a successful save, the creature takes half as much damage and isn't knocked prone."
      }
    ],
    "id": "androesfinge",
    "tokenImageUrl": "/assets/2d/Monstros/Androesfinge.png",
    "tokenType": "billboard"
  },
  {
    "name": "Aparição",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 12,
    "hp": 22,
    "speed": "0 m, fly: 15 m, hover: true",
    "cr": "1",
    "xp": 200,
    "str": 1,
    "dex": 14,
    "con": 11,
    "int": 10,
    "wis": 10,
    "cha": 11,
    "abilities": [
      {
        "name": "Incorporeal Movement",
        "desc": "The specter can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) dano de força if it ends its turn inside an object."
      },
      {
        "name": "Sunlight Sensitivity",
        "desc": "While in sunlight, the specter has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Life Drain",
        "desc": "Melee Spell Attack: +4 para acertar, alcance 5 metros, one creature. Hit: 10 (3d6) dano necrótico. The target must succeed on a CD 10 Constitution teste de resistência or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the creature finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      }
    ],
    "id": "aparicao",
    "tokenImageUrl": "/assets/2d/Monstros/Aparição.png",
    "tokenType": "billboard"
  },
  {
    "name": "Aranha Gigante",
    "type": "Besta",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 14,
    "hp": 26,
    "speed": "9 m, climb: 9 m",
    "cr": "1",
    "xp": 200,
    "str": 14,
    "dex": 16,
    "con": 12,
    "int": 2,
    "wis": 11,
    "cha": 4,
    "abilities": [
      {
        "name": "Spider Climb",
        "desc": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "desc": "While in contact with a web, the spider knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "desc": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, one creature. Hit: 7 (1d8 + 3) dano perfurante, and the target must make a CD 11 Constitution teste de resistência, taking 9 (2d8) dano de veneno on a failed save, or half as much damage on a successful one. If the dano de veneno reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way."
      },
      {
        "name": "Web",
        "desc": "Ataque à Distância com Arma: +5 para acertar, alcance 30/60 metros, one creature. Hit: The target is restrained by webbing. As an action, the restrained target can make a CD 12 Strength check, bursting the webbing on a success. The webbing can also be attacked and destroyed (AC 10; hp 5; vulnerability to dano de fogo; immunity to bludgeoning, poison, and dano psíquico)."
      }
    ],
    "id": "aranha-gigante",
    "tokenImageUrl": "/assets/2d/Monstros/Aranha Gigante.png",
    "tokenType": "billboard"
  },
  {
    "name": "Arqueiro Goblin",
    "type": "Humanóide",
    "size": "Pequeno",
    "alignment": "Neutro e Mau",
    "ac": 15,
    "hp": 7,
    "speed": "9 m",
    "cr": "1/4",
    "xp": 50,
    "str": 8,
    "dex": 14,
    "con": 10,
    "int": 10,
    "wis": 8,
    "cha": 8,
    "abilities": [
      {
        "name": "Nimble Escape",
        "desc": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
      }
    ],
    "actions": [
      {
        "name": "Adaga",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 1.5m, um alvo. Acerto: 4 (1d4 + 2) de dano perfurante."
      },
      {
        "name": "Arco Curto",
        "desc": "Ataque à Distância com Arma: +4 para acertar, distância 24/96m, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante."
      }
    ],
    "id": "arqueiro-goblin",
    "tokenImageUrl": "/assets/2d/Monstros/Arqueiro Goblin.png",
    "tokenType": "billboard"
  },
  {
    "name": "Balor",
    "type": "Ínfero",
    "size": "Enorme",
    "alignment": "Caótico e Mau",
    "ac": 19,
    "hp": 262,
    "speed": "12 m, fly: 24 m",
    "cr": "19",
    "xp": 22000,
    "str": 26,
    "dex": 15,
    "con": 22,
    "int": 20,
    "wis": 16,
    "cha": 22,
    "abilities": [
      {
        "name": "Death Throes",
        "desc": "When the balor dies, it explodes, and each creature within 30 feet of it must make a CD 20 Dexterity teste de resistência, taking 70 (20d6) dano de fogo on a failed save, or half as much damage on a successful one. The explosion ignites flammable objects in that area that aren't being worn or carried, and it destroys the balor's weapons."
      },
      {
        "name": "Fire Aura",
        "desc": "At the start of each of the balor's turns, each creature within 5 feet of it takes 10 (3d6) dano de fogo, and flammable objects in the aura that aren't being worn or carried ignite. A creature that touches the balor or hits it with a melee attack while within 5 feet of it takes 10 (3d6) dano de fogo."
      },
      {
        "name": "Magic Resistance",
        "desc": "The balor has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The balor's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The balor makes two attacks: one with its longsword and one with its whip."
      },
      {
        "name": "Longsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 10 metros, um alvo. Hit: 21 (3d8 + 8) dano cortante mais 13 (3d8) dano elétrico. If the balor scores a critical hit, it rolls damage dice three times, instead of twice."
      },
      {
        "name": "Whip",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 30 metros, um alvo. Hit: 15 (2d6 + 8) dano cortante mais 10 (3d6) dano de fogo, and the target must succeed on a CD 20 Strength teste de resistência or be pulled up to 25 feet toward the balor."
      },
      {
        "name": "Teleport",
        "desc": "The balor magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      }
    ],
    "id": "balor",
    "tokenImageUrl": "/assets/2d/Monstros/Balor.png",
    "tokenType": "billboard"
  },
  {
    "name": "Banshee",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "banshee",
    "tokenImageUrl": "/assets/2d/Monstros/Banshee.png",
    "tokenType": "billboard"
  },
  {
    "name": "Basilisco",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Sem Alinhamento",
    "ac": 12,
    "hp": 52,
    "speed": "6 m",
    "cr": "3",
    "xp": 700,
    "str": 16,
    "dex": 8,
    "con": 15,
    "int": 2,
    "wis": 8,
    "cha": 7,
    "abilities": [
      {
        "name": "Petrifying Gaze",
        "desc": "If a creature starts its turn within 30 metros of the basilisk and the two of them can see each other, the basilisk can force the creature to make a CD 12 Constitution teste de resistência if the basilisk isn't incapacitated. On a failed save, the creature magically begins to turn to stone and is restrained. It must repeat the teste de resistência at the end of its next turn. On a success, the effect ends. On a failure, the creature is petrified until freed by the greater restoration spell or other magic.\nA creature that isn't surprised can avert its eyes to avoid the teste de resistência at the start of its turn. If it does so, it can't see the basilisk until the start of its next turn, when it can avert its eyes again. If it looks at the basilisk in the meantime, it must immediately make the save.\nIf the basilisk sees its reflection within 30 metros of it in bright light, it mistakes itself for a rival and targets itself with its gaze."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 10 (2d6 + 3) dano perfurante mais 7 (2d6) dano de veneno."
      }
    ],
    "id": "basilisco",
    "tokenImageUrl": "/assets/2d/Monstros/Basilisco.png",
    "tokenType": "billboard"
  },
  {
    "type": "Aberração",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 18,
    "hp": 180,
    "speed": "0m, voo 6m (flutuar)",
    "cr": "13",
    "xp": 10000,
    "str": 10,
    "dex": 14,
    "con": 18,
    "int": 17,
    "wis": 15,
    "cha": 17,
    "abilities": [
      {
        "name": "Cone Antimagia",
        "desc": "O olho central do observador cria uma área de antimagia em um cone de 45 metros. No início de cada um de seus turnos, o observador decide para onde o cone está voltado e se ele está ativo."
      }
    ],
    "actions": [
      {
        "name": "Mordida",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 1.5m, um alvo. Acerto: 14 (4d6) de dano perfurante."
      },
      {
        "name": "Raios Oculares",
        "desc": "O observador dispara aleatoriamente 3 raios oculares em alvos que ele possa ver a até 36 metros (Raio de Charme, Raio de Paralisia, Raio de Medo, Raio de Desaceleração, Raio de Telecinesia, Raio de Sono, Raio de Petrificação, Raio de Desintegração, Raio da Morte)."
      }
    ],
    "name": "Beholder",
    "id": "beholder",
    "tokenImageUrl": "/assets/2d/Monstros/Beholder.png",
    "tokenType": "billboard"
  },
  {
    "name": "Bruxa Verde",
    "type": "Fada",
    "size": "Médio",
    "alignment": "Neutro e Mau",
    "ac": 17,
    "hp": 82,
    "speed": "9 m",
    "cr": "3",
    "xp": 700,
    "str": 18,
    "dex": 12,
    "con": 16,
    "int": 13,
    "wis": 14,
    "cha": 14,
    "abilities": [
      {
        "name": "Amphibious",
        "desc": "The hag can breathe air and water."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The hag's innate spellcasting ability is Charisma (spell save CD 12). She can innately cast the following spells, requiring no material components:\n\nAt will: dancing lights, minor illusion, vicious mockery"
      },
      {
        "name": "Mimicry",
        "desc": "The hag can mimic animal sounds and humanoid voices. A creature that hears the sounds can tell they are imitations with a successful CD 14 Wisdom (Insight) check."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano cortante."
      },
      {
        "name": "Illusory Appearance",
        "desc": "The hag covers herself and anything she is wearing or carrying with a magical illusion that makes her look like another creature of her general size and humanoid shape. The illusion ends if the hag takes a bonus action to end it or if she dies.\nThe changes wrought by this effect fail to hold up to physical inspection. For example, the hag could appear to have smooth skin, but someone touching her would feel her rough flesh. Otherwise, a creature must take an action to visually inspect the illusion and succeed on a CD 20 Intelligence (Investigation) check to discern that the hag is disguised."
      },
      {
        "name": "Invisible Passage",
        "desc": "The hag magically turns invisible until she attacks or casts a spell, or until her concentration ends (as if concentrating on a spell). While invisible, she leaves no physical evidence of her passage, so she can be tracked only by magic. Any equipment she wears or carries is invisible with her."
      }
    ],
    "id": "bruxa-verde",
    "tokenImageUrl": "/assets/2d/Monstros/Bruxa Verde.png",
    "tokenType": "billboard"
  },
  {
    "name": "Bugbear",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 16,
    "hp": 27,
    "speed": "9 m",
    "cr": "1",
    "xp": 200,
    "str": 15,
    "dex": 14,
    "con": 13,
    "int": 8,
    "wis": 11,
    "cha": 9,
    "abilities": [
      {
        "name": "Brute",
        "desc": "A melee weapon deals one extra die of its damage when the bugbear hits with it (included in the attack)."
      },
      {
        "name": "Surprise Attack",
        "desc": "If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage from the attack."
      }
    ],
    "actions": [
      {
        "name": "Morningstar",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d8 + 2) dano perfurante."
      },
      {
        "name": "Javelin",
        "desc": "Melee or Ataque à Distância com Arma: +4 para acertar, alcance 5 metros or alcance 30/120 metros, um alvo. Hit: 9 (2d6 + 2) dano perfurante in melee or 5 (1d6 + 2) dano perfurante at alcance."
      }
    ],
    "id": "bugbear",
    "tokenImageUrl": "/assets/2d/Monstros/Bugbear.png",
    "tokenType": "billboard"
  },
  {
    "name": "Bulette",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 17,
    "hp": 94,
    "speed": "12 m, burrow: 12 m",
    "cr": "5",
    "xp": 1800,
    "str": 19,
    "dex": 11,
    "con": 21,
    "int": 2,
    "wis": 10,
    "cha": 5,
    "abilities": [
      {
        "name": "Standing Leap",
        "desc": "The bulette's long jump is up to 30 metros and its high jump is up to 15 metros, with or without a running start."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 30 (4d12 + 4) dano perfurante."
      },
      {
        "name": "Deadly Leap",
        "desc": "If the bulette jumps at least 15 metros as part of its movement, it can then use this action to land on its feet in a space that contains one or more other creatures. Each of those creatures must succeed on a CD 16 Strength or Dexterity teste de resistência (target's choice) or be knocked prone and take 14 (3d6 + 4) dano de concussão mais 14 (3d6 + 4) dano cortante. On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 metros out of the bulette's space into an unoccupied space of the creature's choice. If no unoccupied space is within alcance, the creature instead falls prone in the bulette's space."
      }
    ],
    "id": "bulette",
    "tokenImageUrl": "/assets/2d/Monstros/Bulette.png",
    "tokenType": "billboard"
  },
  {
    "name": "Carniçal",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 12,
    "hp": 22,
    "speed": "9 m",
    "cr": "1",
    "xp": 200,
    "str": 13,
    "dex": 15,
    "con": 10,
    "int": 7,
    "wis": 10,
    "cha": 6,
    "abilities": [],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +2 para acertar, alcance 5 metros, one creature. Hit: 9 (2d6 + 2) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 7 (2d4 + 2) dano cortante. If the target is a creature other than an elf or undead, it must succeed on a CD 10 Constitution teste de resistência or be paralyzed for 1 minute. The target can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "id": "carnical",
    "tokenImageUrl": "/assets/2d/Monstros/Carniçal.png",
    "tokenType": "billboard"
  },
  {
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Neutro",
    "ac": 13,
    "hp": 84,
    "speed": "9m (30ft)",
    "cr": "5",
    "xp": 1800,
    "str": 19,
    "dex": 12,
    "con": 21,
    "int": 3,
    "wis": 12,
    "cha": 8,
    "abilities": [
      {
        "name": "Fedor",
        "desc": "Qualquer criatura que iniciar seu turno a até 3 metros do catoblepas deve passar em um teste de resistência de Constituição CD 16 ou ficará Envenenada."
      }
    ],
    "actions": [
      {
        "name": "Pancada com Cauda",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 3m, um alvo. Acerto: 15 (2d10 + 4) de dano de concussão e o alvo deve passar em teste de resistência de CON CD 16 ou fica atordoado."
      },
      {
        "name": "Olhar da Morte (Recarga 5-6)",
        "desc": "O catoblepas mira seu olhar mortífero em uma criatura a até 9 metros. Teste de resistência de Constituição CD 16. Em caso de falha, sofre 36 (8d8) de dano necrótico."
      }
    ],
    "name": "Catoblepas",
    "id": "catoblepas",
    "tokenImageUrl": "/assets/2d/Monstros/Catoblepas.png",
    "tokenType": "billboard"
  },
  {
    "name": "Cavaleiro da Morta",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "cavaleiro-da-morta",
    "tokenImageUrl": "/assets/2d/Monstros/Cavaleiro da Morta.png",
    "tokenType": "billboard"
  },
  {
    "name": "Caveira Flamejante",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "caveira-flamejante",
    "tokenImageUrl": "/assets/2d/Monstros/Caveira Flamejante.png",
    "tokenType": "billboard"
  },
  {
    "name": "Centauro",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Neutro e Bom",
    "ac": 12,
    "hp": 45,
    "speed": "15 m",
    "cr": "2",
    "xp": 450,
    "str": 18,
    "dex": 14,
    "con": 14,
    "int": 9,
    "wis": 13,
    "cha": 11,
    "abilities": [
      {
        "name": "Charge",
        "desc": "If the centaur moves at least 30 metros straight toward a target and then hits it with a pike attack on the same turn, the target takes an extra 10 (3d6) dano perfurante."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The centaur makes two attacks: one with its pike and one with its hooves or two with its longbow."
      },
      {
        "name": "Pike",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 10 metros, um alvo. Hit: 9 (1d10 + 4) dano perfurante."
      },
      {
        "name": "Hooves",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d6 + 4) dano de concussão."
      },
      {
        "name": "Longbow",
        "desc": "Ataque à Distância com Arma: +4 para acertar, alcance 150/600 metros, um alvo. Hit: 6 (1d8 + 2) dano perfurante."
      }
    ],
    "id": "centauro",
    "tokenImageUrl": "/assets/2d/Monstros/Centauro.png",
    "tokenType": "billboard"
  },
  {
    "name": "Ciclope",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "ciclope",
    "tokenImageUrl": "/assets/2d/Monstros/Ciclope.png",
    "tokenType": "billboard"
  },
  {
    "name": "Cocatriz",
    "type": "Monstruosidade",
    "size": "Pequeno",
    "alignment": "Sem Alinhamento",
    "ac": 11,
    "hp": 27,
    "speed": "6 m, fly: 12 m",
    "cr": "0.5",
    "xp": 100,
    "str": 6,
    "dex": 12,
    "con": 12,
    "int": 2,
    "wis": 13,
    "cha": 5,
    "abilities": [],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, one creature. Hit: 3 (1d4 + 1) dano perfurante, and the target must succeed on a CD 11 Constitution teste de resistência against being magically petrified. On a failed save, the creature begins to turn to stone and is restrained. It must repeat the teste de resistência at the end of its next turn. On a success, the effect ends. On a failure, the creature is petrified for 24 hours."
      }
    ],
    "id": "cocatriz",
    "tokenImageUrl": "/assets/2d/Monstros/Cocatriz.png",
    "tokenType": "billboard"
  },
  {
    "name": "Cubo Gelatinoso",
    "type": "Limo",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 6,
    "hp": 84,
    "speed": "5 m",
    "cr": "2",
    "xp": 450,
    "str": 14,
    "dex": 3,
    "con": 20,
    "int": 1,
    "wis": 6,
    "cha": 1,
    "abilities": [
      {
        "name": "Ooze Cube",
        "desc": "The cube takes up its entire space. Other creatures can enter the space, but a creature that does so is subjected to the cube's Engulf and has disadvantage on the teste de resistência.\nCreatures inside the cube can be seen but have total cover.\nA creature within 5 feet of the cube can take an action to pull a creature or object out of the cube. Doing so requires a successful CD 12 Strength check, and the creature making the attempt takes 10 (3d6) dano de ácido.\nThe cube can hold only one Large creature or up to four Medium or smaller creatures inside it at a time."
      },
      {
        "name": "Transparent",
        "desc": "Even when the cube is in plain sight, it takes a successful CD 15 Wisdom (Perception) check to spot a cube that has neither moved nor attacked. A creature that tries to enter the cube's space while unaware of the cube is surprised by the cube."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, one creature. Hit: 10 (3d6) dano de ácido."
      },
      {
        "name": "Engulf",
        "desc": "The cube moves up to its speed. While doing so, it can enter Large or smaller creatures' spaces. Whenever the cube enters a creature's space, the creature must make a CD 12 Dexterity teste de resistência.\nOn a successful save, the creature can choose to be pushed 5 feet back or to the side of the cube. A creature that chooses not to be pushed suffers the consequences of a failed teste de resistência.\nOn a failed save, the cube enters the creature's space, and the creature takes 10 (3d6) dano de ácido and is engulfed. The engulfed creature can't breathe, is restrained, and takes 21 (6d6) dano de ácido at the start of each of the cube's turns. When the cube moves, the engulfed creature moves with it.\nAn engulfed creature can try to escape by taking an action to make a CD 12 Strength check. On a success, the creature escapes and enters a space of its choice within 5 feet of the cube."
      }
    ],
    "id": "cubo-gelatinoso",
    "tokenImageUrl": "/assets/2d/Monstros/Cubo Gelatinoso.png",
    "tokenType": "billboard"
  },
  {
    "type": "Aberração",
    "size": "Médio",
    "alignment": "Leal e Mau",
    "ac": 15,
    "hp": 71,
    "speed": "9m (30ft)",
    "cr": "7",
    "xp": 2900,
    "str": 11,
    "dex": 12,
    "con": 12,
    "int": 19,
    "wis": 17,
    "cha": 17,
    "abilities": [
      {
        "name": "Resistência à Magia",
        "desc": "O devorador de mentes tem vantagem em testes de resistência contra magias e outros efeitos mágicos."
      },
      {
        "name": "Conjunção Inata (Psiquismo)",
        "desc": "A habilidade de conjuração inata do devorador de mentes é Inteligência (salvamento de magia CD 15). Ele pode conjurar de forma inata as seguintes magias sem necessidade de componentes materiais: À Vontade: detectar pensamentos, levitação. 1/dia cada: dominar monstro, viagem planar (apenas em si mesmo)."
      }
    ],
    "actions": [
      {
        "name": "Tentáculos",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 1.5m, uma criatura. Acerto: 15 (2d10 + 4) de dano psíquico. Se o alvo for de tamanho Médio ou menor, ele fica agarrado (CD 15 para escapar) e deve passar em um teste de resistência de Inteligência CD 15 ou ficará atordoado até o agarrão terminar."
      },
      {
        "name": "Extrair Cérebro",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 1.5m, um humanóide incapacitado agarrado pelo devorador de mentes. Acerto: 55 (10d10) de dano perfurante. Se este dano reduzir o alvo a 0 pontos de vida, o devorador de mentes mata o alvo ao extrair e devorar seu cérebro."
      },
      {
        "name": "Rajada Psíquica (Recarga 5-6)",
        "desc": "O devorador de mentes emite magicamente energia psíquica em um cone de 18 metros. Cada criatura na área deve ser bem-sucedida em um teste de resistência de Inteligência CD 15 ou sofrerá 22 (4d8 + 4) de dano psíquico e ficará atordoada por 1 minuto. A criatura pode repetir o teste de resistência no final de cada um dos seus turnos, terminando o efeito sobre si mesma em caso de sucesso."
      }
    ],
    "name": "Devorador de Mentes",
    "id": "devorador-de-mentes",
    "tokenImageUrl": "/assets/2d/Monstros/Devorador de Mentes.png",
    "tokenType": "billboard"
  },
  {
    "name": "Diabo de Chifres",
    "type": "Ínfero",
    "size": "Grande",
    "alignment": "Leal e Mau",
    "ac": 18,
    "hp": 178,
    "speed": "6 m, fly: 18 m",
    "cr": "11",
    "xp": 7200,
    "str": 22,
    "dex": 17,
    "con": 21,
    "int": 12,
    "wis": 16,
    "cha": 17,
    "abilities": [
      {
        "name": "Devil's Sight",
        "desc": "Magical darkness doesn't impede the devil's darkvision."
      },
      {
        "name": "Magic Resistance",
        "desc": "The devil has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The devil makes three melee attacks: two with its fork and one with its tail. It can use Hurl Flame in place of any melee attack."
      },
      {
        "name": "Fork",
        "desc": "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 10 metros, um alvo. Hit: 15 (2d8 + 6) dano perfurante."
      },
      {
        "name": "Tail",
        "desc": "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 10 metros, um alvo. Hit: 10 (1d8 + 6) dano perfurante. If the target is a creature other than an undead or a construct, it must succeed on a CD 17 Constitution teste de resistência or lose 10 (3d6) hit points at the start of each of its turns due to an infernal wound. Each time the devil hits the wounded target with this attack, the damage dealt by the wound increases by 10 (3d6). Any creature can take an action to stanch the wound with a successful CD 12 Wisdom (Medicine) check. The wound also closes if the target receives magical healing."
      },
      {
        "name": "Hurl Flame",
        "desc": "Ranged Spell Attack: +7 para acertar, alcance 150 metros, um alvo. Hit: 14 (4d6) dano de fogo. If the target is a flammable object that isn't being worn or carried, it also catches fire."
      }
    ],
    "id": "diabo-de-chifres",
    "tokenImageUrl": "/assets/2d/Monstros/Diabo de Chifres.png",
    "tokenType": "billboard"
  },
  {
    "name": "Diabo do Abismo",
    "type": "Ínfero",
    "size": "Grande",
    "alignment": "Leal e Mau",
    "ac": 19,
    "hp": 300,
    "speed": "9 m, fly: 18 m",
    "cr": "20",
    "xp": 25000,
    "str": 26,
    "dex": 14,
    "con": 24,
    "int": 22,
    "wis": 18,
    "cha": 24,
    "abilities": [
      {
        "name": "Fear Aura",
        "desc": "Any creature hostile to the pit fiend that starts its turn within 20 feet of the pit fiend must make a CD 21 Wisdom teste de resistência, unless the pit fiend is incapacitated. On a failed save, the creature is frightened until the start of its next turn. If a creature's teste de resistência is successful, the creature is immune to the pit fiend's Fear Aura for the next 24 hours."
      },
      {
        "name": "Magic Resistance",
        "desc": "The pit fiend has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The pit fiend's weapon attacks are magical."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The pit fiend's spellcasting ability is Charisma (spell save CD 21). The pit fiend can innately cast the following spells, requiring no material components:\nAt will: detect magic, fireball\n3/day each: hold monster, wall of fire"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The pit fiend makes four attacks: one with its bite, one with its claw, one with its mace, and one with its tail."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 5 metros, um alvo. Hit: 22 (4d6 + 8) dano perfurante. The target must succeed on a CD 21 Constitution teste de resistência or become poisoned. While poisoned in this way, the target can't regain hit points, and it takes 21 (6d6) dano de veneno at the start of each of its turns. The poisoned target can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success."
      },
      {
        "name": "Claw",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 10 metros, um alvo. Hit: 17 (2d8 + 8) dano cortante."
      },
      {
        "name": "Mace",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 10 metros, um alvo. Hit: 15 (2d6 + 8) dano de concussão mais 21 (6d6) dano de fogo."
      },
      {
        "name": "Tail",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 10 metros, um alvo. Hit: 24 (3d10 + 8) dano de concussão."
      }
    ],
    "id": "diabo-do-abismo",
    "tokenImageUrl": "/assets/2d/Monstros/Diabo do Abismo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Djinni",
    "type": "Elemental",
    "size": "Grande",
    "alignment": "Caótico e Bom",
    "ac": 17,
    "hp": 161,
    "speed": "9 m, fly: 27 m",
    "cr": "11",
    "xp": 7200,
    "str": 21,
    "dex": 15,
    "con": 22,
    "int": 15,
    "wis": 16,
    "cha": 20,
    "abilities": [
      {
        "name": "Elemental Demise",
        "desc": "If the djinni dies, its body disintegrates into a warm breeze, leaving behind only equipment the djinni was wearing or carrying."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The djinni's innate spellcasting ability is Charisma (spell save CD 17, +9 para acertar with spell attacks). It can innately cast the following spells, requiring no material components:\n\nAt will: detect evil and good, detect magic, thunderwave\n3/day each: create food and water (can create wine instead of water), tongues, wind walk\n1/day each: conjure elemental (air elemental only), creation, gaseous form, invisibility, major image, plane shift"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The djinni makes three scimitar attacks."
      },
      {
        "name": "Scimitar",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 5 metros, um alvo. Hit: 12 (2d6 + 5) dano cortante mais 3 (1d6) lightning or dano trovejante (djinni's choice)."
      },
      {
        "name": "Create Whirlwind",
        "desc": "A 5-foot-radius, 30-foot-tall cylinder of swirling air magically forms on a point the djinni can see within 120 feet of it. The whirlwind lasts as long as the djinni maintains concentration (as if concentrating on a spell). Any creature but the djinni that enters the whirlwind must succeed on a CD 18 Strength teste de resistência or be restrained by it. The djinni can move the whirlwind up to 60 feet as an action, and creatures restrained by the whirlwind move with it. The whirlwind ends if the djinni loses sight of it.\nA creature can use its action to free a creature restrained by the whirlwind, including itself, by succeeding on a CD 18 Strength check. If the check succeeds, the creature is no longer restrained and moves to the nearest space outside the whirlwind."
      }
    ],
    "id": "djinni",
    "tokenImageUrl": "/assets/2d/Monstros/Djinni.png",
    "tokenType": "billboard"
  },
  {
    "name": "Dopel",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Sem Alinhamento",
    "ac": 14,
    "hp": 52,
    "speed": "9 m",
    "cr": "3",
    "xp": 700,
    "str": 11,
    "dex": 18,
    "con": 14,
    "int": 11,
    "wis": 12,
    "cha": 14,
    "abilities": [
      {
        "name": "Shapechanger",
        "desc": "The doppelganger can use its action to polymorph into a Small or Medium humanoid it has seen, or back into its true form. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Ambusher",
        "desc": "In the first round of combat, the doppelganger has advantage on attack rolls against any creature it has surprised."
      },
      {
        "name": "Surprise Attack",
        "desc": "If the doppelganger surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 10 (3d6) damage from the attack."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The doppelganger makes two melee attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 7 (1d6 + 4) dano de concussão."
      },
      {
        "name": "Read Thoughts",
        "desc": "The doppelganger magically reads the surface thoughts of one creature within 60 metros of it. The effect can penetrate barriers, but 3 metros of wood or dirt, 2 metros of stone, 2 inches of metal, or a thin sheet of lead blocks it. While the target is in alcance, the doppelganger can continue reading its thoughts, as long as the doppelganger's concentration isn't broken (as if concentrating on a spell). While reading the target's mind, the doppelganger has advantage on Wisdom (Insight) and Charisma (Deception, Intimidation, and Persuasion) checks against the target."
      }
    ],
    "id": "dopel",
    "tokenImageUrl": "/assets/2d/Monstros/Dopel.png",
    "tokenType": "billboard"
  },
  {
    "name": "Driade",
    "type": "Fada",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 11,
    "hp": 22,
    "speed": "9 m",
    "cr": "1",
    "xp": 200,
    "str": 10,
    "dex": 12,
    "con": 11,
    "int": 14,
    "wis": 15,
    "cha": 18,
    "abilities": [
      {
        "name": "Innate Spellcasting",
        "desc": "The dryad's innate spellcasting ability is Charisma (spell save CD 14). The dryad can innately cast the following spells, requiring no material components:\n\nAt will: druidcraft\n3/day each: entangle, goodberry\n1/day each: barkskin, pass without trace, shillelagh"
      },
      {
        "name": "Magic Resistance",
        "desc": "The dryad has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Speak with Beasts and Plants",
        "desc": "The dryad can communicate with beasts and plants as if they shared a language."
      },
      {
        "name": "Tree Stride",
        "desc": "Once on her turn, the dryad can use 10 metros of her movement to step magically into one living tree within her alcance and emerge from a second living tree within 60 metros of the first tree, appearing in an unoccupied space within 5 metros of the second tree. Both trees must be large or bigger."
      }
    ],
    "actions": [
      {
        "name": "Club",
        "desc": "Ataque Corpo-a-Corpo com Arma: +2 para acertar (+6 para acertar with shillelagh), alcance 5 metros, um alvo. Hit: 2 (1d4) dano de concussão, or 8 (1d8 + 4) dano de concussão with shillelagh."
      },
      {
        "name": "Fey Charm",
        "desc": "The dryad targets one humanoid or beast that she can see within 30 feet of her. If the target can see the dryad, it must succeed on a CD 14 Wisdom teste de resistência or be magically charmed. The charmed creature regards the dryad as a trusted friend to be heeded and protected. Although the target isn't under the dryad's control, it takes the dryad's requests or actions in the most favorable way it can.\nEach time the dryad or its allies do anything harmful to the target, it can repeat the teste de resistência, ending the effect on itself on a success. Otherwise, the effect lasts 24 hours or until the dryad dies, is on a different plane of existence from the target, or ends the effect as a bonus action. If a target's teste de resistência is successful, the target is immune to the dryad's Fey Charm for the next 24 hours.\nThe dryad can have no more than one humanoid and up to three beasts charmed at a time."
      }
    ],
    "id": "driade",
    "tokenImageUrl": "/assets/2d/Monstros/Driade.png",
    "tokenType": "billboard"
  },
  {
    "name": "Drider",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 19,
    "hp": 123,
    "speed": "9 m, climb: 9 m",
    "cr": "6",
    "xp": 2300,
    "str": 16,
    "dex": 16,
    "con": 18,
    "int": 13,
    "wis": 14,
    "cha": 12,
    "abilities": [
      {
        "name": "Fey Ancestry",
        "desc": "The drider has advantage on saving throws against being charmed, and magic can't put the drider to sleep."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The drider's innate spellcasting ability is Wisdom (spell save CD 13). The drider can innately cast the following spells, requiring no material components:\nAt will: dancing lights\n1/day each: darkness, faerie fire"
      },
      {
        "name": "Spider Climb",
        "desc": "The drider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Sunlight Sensitivity",
        "desc": "While in sunlight, the drider has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      },
      {
        "name": "Web Walker",
        "desc": "The drider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The drider makes three attacks, either with its longsword or its longbow. It can replace one of those attacks with a bite attack."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, one creature. Hit: 2 (1d4) dano perfurante mais 9 (2d8) dano de veneno."
      },
      {
        "name": "Longsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 7 (1d8 + 3) dano cortante, or 8 (1d10 + 3) dano cortante if used with two hands."
      },
      {
        "name": "Longbow",
        "desc": "Ataque à Distância com Arma: +6 para acertar, alcance 150/600 metros, um alvo. Hit: 7 (1d8 + 3) dano perfurante mais 4 (1d8) dano de veneno."
      }
    ],
    "id": "drider",
    "tokenImageUrl": "/assets/2d/Monstros/Drider.png",
    "tokenType": "billboard"
  },
  {
    "name": "Efreeti",
    "type": "Elemental",
    "size": "Grande",
    "alignment": "Leal e Mau",
    "ac": 17,
    "hp": 200,
    "speed": "12 m, fly: 18 m",
    "cr": "11",
    "xp": 7200,
    "str": 22,
    "dex": 12,
    "con": 24,
    "int": 16,
    "wis": 15,
    "cha": 16,
    "abilities": [
      {
        "name": "Elemental Demise",
        "desc": "If the efreeti dies, its body disintegrates in a flash of fire and puff of smoke, leaving behind only equipment the djinni was wearing or carrying."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The efreeti's innate spell casting ability is Charisma (spell save CD 15, +7 para acertar with spell attacks). It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic\n3/day: enlarge/reduce, tongues\n1/day each: conjure elemental (fire elemental only), gaseous form, invisibility, major image, plane shift, wall of fire"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The efreeti makes two scimitar attacks or uses its Hurl Flame twice."
      },
      {
        "name": "Scimitar",
        "desc": "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d6 + 6) dano cortante mais 7 (2d6) dano de fogo."
      },
      {
        "name": "Hurl Flame",
        "desc": "Ranged Spell Attack: +7 para acertar, alcance 120 metros, um alvo. Hit: 17 (5d6) dano de fogo."
      }
    ],
    "id": "efreeti",
    "tokenImageUrl": "/assets/2d/Monstros/Efreeti.png",
    "tokenType": "billboard"
  },
  {
    "name": "Elemental da Agua",
    "type": "Elemental",
    "size": "Grande",
    "alignment": "Neutro",
    "ac": 14,
    "hp": 114,
    "speed": "9 m, swim: 27 m",
    "cr": "5",
    "xp": 1800,
    "str": 18,
    "dex": 14,
    "con": 18,
    "int": 5,
    "wis": 10,
    "cha": 8,
    "abilities": [
      {
        "name": "Water Form",
        "desc": "The elemental can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Freeze",
        "desc": "If the elemental takes dano de frio, it partially freezes; its speed is reduced by 20 metros until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano de concussão."
      },
      {
        "name": "Whelm",
        "desc": "Each creature in the elemental's space must make a CD 15 Strength teste de resistência. On a failure, a target takes 13 (2d8 + 4) dano de concussão. If it is Large or smaller, it is also grappled (escape CD 14). Until this grapple ends, the target is restrained and unable to breathe unless it can breathe water. If the teste de resistência is successful, the target is pushed out of the elemental's space.\nThe elemental can grapple one Large creature or up to two Medium or smaller creatures at one time. At the start of each of the elemental's turns, each target grappled by it takes 13 (2d8 + 4) dano de concussão. A creature within 5 feet of the elemental can pull a creature or object out of it by taking an action to make a CD 14 Strength and succeeding."
      }
    ],
    "id": "elemental-da-agua",
    "tokenImageUrl": "/assets/2d/Monstros/Elemental da Agua.png",
    "tokenType": "billboard"
  },
  {
    "name": "Elemental da Pedra",
    "type": "Elemental",
    "size": "Grande",
    "alignment": "Neutro",
    "ac": 17,
    "hp": 126,
    "speed": "9 m, burrow: 9 m",
    "cr": "5",
    "xp": 1800,
    "str": 20,
    "dex": 8,
    "con": 20,
    "int": 5,
    "wis": 10,
    "cha": 5,
    "abilities": [
      {
        "name": "Earth Glide",
        "desc": "The elemental can burrow through nonmagical, unworked earth and stone. While doing so, the elemental doesn't disturb the material it moves through."
      },
      {
        "name": "Siege Monster",
        "desc": "The elemental deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 10 metros, um alvo. Hit: 14 (2d8 + 5) dano de concussão."
      }
    ],
    "id": "elemental-da-pedra",
    "tokenImageUrl": "/assets/2d/Monstros/Elemental da Pedra.png",
    "tokenType": "billboard"
  },
  {
    "name": "Elemental do Fogo",
    "type": "Elemental",
    "size": "Grande",
    "alignment": "Neutro",
    "ac": 13,
    "hp": 102,
    "speed": "15 m",
    "cr": "5",
    "xp": 1800,
    "str": 10,
    "dex": 17,
    "con": 16,
    "int": 6,
    "wis": 10,
    "cha": 7,
    "abilities": [
      {
        "name": "Fire Form",
        "desc": "The elemental can move through a space as narrow as 1 inch wide without squeezing. A creature that touches the elemental or hits it with a melee attack while within 5 metros of it takes 5 (1d10) dano de fogo. In addition, the elemental can enter a hostile creature's space and stop there. The first time it enters a creature's space on a turn, that creature takes 5 (1d10) dano de fogo and catches fire; until someone takes an action to douse the fire, the creature takes 5 (1d10) dano de fogo at the start of each of its turns."
      },
      {
        "name": "Illumination",
        "desc": "The elemental sheds bright light in a 30-foot radius and dim light in an additional 30 metros."
      },
      {
        "name": "Water Susceptibility",
        "desc": "For every 5 metros the elemental moves in water, or for every gallon of water splashed on it, it takes 1 dano de frio."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The elemental makes two touch attacks."
      },
      {
        "name": "Touch",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 10 (2d6 + 3) dano de fogo. If the target is a creature or a flammable object, it ignites. Until a creature takes an action to douse the fire, the target takes 5 (1d10) dano de fogo at the start of each of its turns."
      }
    ],
    "id": "elemental-do-fogo",
    "tokenImageUrl": "/assets/2d/Monstros/Elemental do Fogo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Elemental do Vento",
    "type": "Elemental",
    "size": "Grande",
    "alignment": "Neutro",
    "ac": 15,
    "hp": 90,
    "speed": "fly: 27 m, hover: true",
    "cr": "5",
    "xp": 1800,
    "str": 14,
    "dex": 20,
    "con": 14,
    "int": 6,
    "wis": 10,
    "cha": 6,
    "abilities": [
      {
        "name": "Air Form",
        "desc": "The elemental can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 5 metros, um alvo. Hit: 14 (2d8 + 5) dano de concussão."
      },
      {
        "name": "Whirlwind",
        "desc": "Each creature in the elemental's space must make a CD 13 Strength teste de resistência. On a failure, a target takes 15 (3d8 + 2) dano de concussão and is flung up 20 feet away from the elemental in a random direction and knocked prone. If a thrown target strikes an object, such as a wall or floor, the target takes 3 (1d6) dano de concussão for every 10 feet it was thrown. If the target is thrown at another creature, that creature must succeed on a CD 13 Dexterity teste de resistência or take the same damage and be knocked prone.\nIf the teste de resistência is successful, the target takes half the dano de concussão and isn't flung away or knocked prone."
      }
    ],
    "id": "elemental-do-vento",
    "tokenImageUrl": "/assets/2d/Monstros/Elemental do Vento.png",
    "tokenType": "billboard"
  },
  {
    "name": "Elfo Drow",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Neutro e Mau",
    "ac": 15,
    "hp": 13,
    "speed": "9 m",
    "cr": "0.25",
    "xp": 50,
    "str": 10,
    "dex": 14,
    "con": 10,
    "int": 11,
    "wis": 11,
    "cha": 12,
    "abilities": [
      {
        "name": "Fey Ancestry",
        "desc": "The drow has advantage on saving throws against being charmed, and magic can't put the drow to sleep."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The drow's spellcasting ability is Charisma (spell save CD 11). It can innately cast the following spells, requiring no material components:\nAt will: dancing lights\n1/day each: darkness, faerie fire"
      },
      {
        "name": "Sunlight Sensitivity",
        "desc": "While in sunlight, the drow has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Shortsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      },
      {
        "name": "Hand Crossbow",
        "desc": "Ataque à Distância com Arma: +4 para acertar, alcance 30/120 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante, and the target must succeed on a CD 13 Constitution teste de resistência or be poisoned for 1 hour. If the teste de resistência fails by 5 or more, the target is also unconscious while poisoned in this way. The target wakes up if it takes damage or if another creature takes an action to shake it awake."
      }
    ],
    "id": "elfo-drow",
    "tokenImageUrl": "/assets/2d/Monstros/Elfo Drow.png",
    "tokenType": "billboard"
  },
  {
    "type": "Aberração",
    "size": "Pequeno",
    "alignment": "Caótico e Mau",
    "ac": 16,
    "hp": 13,
    "speed": "9m (30ft), escalada 9m",
    "cr": "1",
    "xp": 200,
    "str": 16,
    "dex": 14,
    "con": 13,
    "int": 4,
    "wis": 12,
    "cha": 7,
    "abilities": [
      {
        "name": "Membros Elásticos",
        "desc": "Os tentáculos e braços do enforcador dão a ele um alcance adicional de 1.5m em ataques corpo-a-corpo."
      }
    ],
    "actions": [
      {
        "name": "Tentáculo",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 3m, um alvo. Acerto: 6 (1d6 + 3) de dano de concussão e o alvo fica agarrado (CD 13 para escapar)."
      }
    ],
    "name": "Enforcador",
    "id": "enforcador",
    "tokenImageUrl": "/assets/2d/Monstros/Enforcador.png",
    "tokenType": "billboard"
  },
  {
    "name": "Ent",
    "type": "Planta",
    "size": "Enorme",
    "alignment": "Caótico e Bom",
    "ac": 16,
    "hp": 138,
    "speed": "9 m",
    "cr": "9",
    "xp": 5000,
    "str": 23,
    "dex": 8,
    "con": 21,
    "int": 12,
    "wis": 16,
    "cha": 12,
    "abilities": [
      {
        "name": "False Appearance",
        "desc": "While the treant remains motionless, it is indistinguishable from a normal tree."
      },
      {
        "name": "Siege Monster",
        "desc": "The treant deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The treant makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 5 metros, um alvo. Hit: 16 (3d6 + 6) dano de concussão."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +10 para acertar, alcance 60/180 metros, um alvo. Hit: 28 (4d10 + 6) dano de concussão."
      },
      {
        "name": "Animate Trees",
        "desc": "The treant magically animates one or two trees it can see within 60 feet of it. These trees have the same statistics as a treant, except they have Intelligence and Charisma scores of 1, they can't speak, and they have only the Slam action option. An animated tree acts as an ally of the treant. The tree remains animate for 1 day or until it dies; until the treant dies or is more than 120 feet from the tree; or until the treant takes a bonus action to turn it back into an inanimate tree. The tree then takes root if possible."
      }
    ],
    "id": "ent",
    "tokenImageUrl": "/assets/2d/Monstros/Ent.png",
    "tokenType": "billboard"
  },
  {
    "name": "Esfinge",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Leal e Neutro",
    "ac": 17,
    "hp": 136,
    "speed": "12 m, fly: 18 m",
    "cr": "11",
    "xp": 7200,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 18,
    "wis": 18,
    "cha": 18,
    "abilities": [
      {
        "name": "Inscrutable",
        "desc": "The sphinx is immune to any effect that would sense its emotions or read its thoughts, as well as any divination spell that it refuses. Wisdom (Insight) checks made to ascertain the sphinx's intentions or sincerity have disadvantage."
      },
      {
        "name": "Magic Weapons",
        "desc": "The sphinx's weapon attacks are magical."
      },
      {
        "name": "Spellcasting",
        "desc": "The sphinx is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save CD 16, +8 para acertar with spell attacks). It requires no material components to cast its spells. The sphinx has the following wizard spells prepared:\n\n- Cantrips (at will): mage hand, minor illusion, prestidigitation\n- 1st level (4 slots): detect magic, identify, shield\n- 2nd level (3 slots): darkness, locate object, suggestion\n- 3rd level (3 slots): dispel magic, remove curse, tongues\n- 4th level (3 slots): banishment, greater invisibility\n- 5th level (1 slot): legend lore"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The sphinx makes two claw attacks."
      },
      {
        "name": "Claw",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano cortante."
      }
    ],
    "id": "esfinge",
    "tokenImageUrl": "/assets/2d/Monstros/Esfinge.png",
    "tokenType": "billboard"
  },
  {
    "name": "Esqueleto",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Leal e Mau",
    "ac": 13,
    "hp": 13,
    "speed": "9 m",
    "cr": "0.25",
    "xp": 50,
    "str": 10,
    "dex": 14,
    "con": 15,
    "int": 6,
    "wis": 8,
    "cha": 5,
    "abilities": [],
    "actions": [
      {
        "name": "Shortsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      },
      {
        "name": "Shortbow",
        "desc": "Ataque à Distância com Arma: +4 para acertar, alcance 80/320 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      }
    ],
    "id": "esqueleto",
    "tokenImageUrl": "/assets/2d/Monstros/Esqueleto.png",
    "tokenType": "billboard"
  },
  {
    "name": "Fantasma",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Qualquer Alinhamento",
    "ac": 11,
    "hp": 45,
    "speed": "0 m, fly: 12 m, hover: true",
    "cr": "4",
    "xp": 1100,
    "str": 7,
    "dex": 13,
    "con": 10,
    "int": 10,
    "wis": 12,
    "cha": 17,
    "abilities": [
      {
        "name": "Ethereal Sight",
        "desc": "The ghost can see 60 metros into the Ethereal Plane when it is on the Material Plane, and vice versa."
      },
      {
        "name": "Incorporeal Movement",
        "desc": "The ghost can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) dano de força if it ends its turn inside an object."
      }
    ],
    "actions": [
      {
        "name": "Withering Touch",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 17 (4d6 + 3) dano necrótico."
      },
      {
        "name": "Etherealness",
        "desc": "The ghost enters the Ethereal Plane from the Material Plane, or vice versa. It is visible on the Material Plane while it is in the Border Ethereal, and vice versa, yet it can't affect or be affected by anything on the other plane."
      },
      {
        "name": "Horrifying Visage",
        "desc": "Each non-undead creature within 60 metros of the ghost that can see it must succeed on a CD 13 Wisdom teste de resistência or be frightened for 1 minute. If the save fails by 5 or more, the target also ages 1d4 × 10 years. A frightened target can repeat the teste de resistência at the end of each of its turns, ending the frightened condition on itself on a success. If a target's teste de resistência is successful or the effect ends for it, the target is immune to this ghost's Horrifying Visage for the next 24 hours. The aging effect can be reversed with a greater restoration spell, but only within 24 hours of it occurring."
      },
      {
        "name": "Possession",
        "desc": "One humanoid that the ghost can see within 5 metros of it must succeed on a CD 13 Charisma teste de resistência or be possessed by the ghost; the ghost then disappears, and the target is incapacitated and loses control of its body. The ghost now controls the body but doesn't deprive the target of awareness. The ghost can't be targeted by any attack, spell, or other effect, except ones that turn undead, and it retains its alignment, Intelligence, Wisdom, Charisma, and immunity to being charmed and frightened. It otherwise uses the possessed target's statistics, but doesn't gain access to the target's knowledge, class features, or proficiencies.\nThe possession lasts until the body drops to 0 hit points, the ghost ends it as a bonus action, or the ghost is turned or forced out by an effect like the dispel evil and good spell. When the possession ends, the ghost reappears in an unoccupied space within 5 metros of the body. The target is immune to this ghost's Possession for 24 hours after succeeding on the teste de resistência or after the possession ends."
      }
    ],
    "id": "fantasma",
    "tokenImageUrl": "/assets/2d/Monstros/Fantasma.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gargula",
    "type": "Elemental",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 15,
    "hp": 52,
    "speed": "9 m, fly: 18 m",
    "cr": "2",
    "xp": 450,
    "str": 15,
    "dex": 11,
    "con": 16,
    "int": 6,
    "wis": 11,
    "cha": 7,
    "abilities": [
      {
        "name": "False Appearance",
        "desc": "While the gargoyle remains motion less, it is indistinguishable from an inanimate statue."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The gargoyle makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano cortante."
      }
    ],
    "id": "gargula",
    "tokenImageUrl": "/assets/2d/Monstros/Gargula.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gigante da Colina",
    "type": "Gigante",
    "size": "Enorme",
    "alignment": "Caótico e Mau",
    "ac": 13,
    "hp": 105,
    "speed": "12 m",
    "cr": "5",
    "xp": 1800,
    "str": 21,
    "dex": 8,
    "con": 19,
    "int": 5,
    "wis": 9,
    "cha": 6,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The giant makes two greatclub attacks."
      },
      {
        "name": "Greatclub",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 10 metros, um alvo. Hit: 18 (3d8 + 5) dano de concussão."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +8 para acertar, alcance 60/240 metros, um alvo. Hit: 21 (3d10 + 5) dano de concussão."
      }
    ],
    "id": "gigante-da-colina",
    "tokenImageUrl": "/assets/2d/Monstros/Gigante da Colina.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gigante da Tempestade",
    "type": "Gigante",
    "size": "Enorme",
    "alignment": "Caótico e Bom",
    "ac": 16,
    "hp": 230,
    "speed": "15 m, swim: 15 m",
    "cr": "13",
    "xp": 10000,
    "str": 29,
    "dex": 14,
    "con": 20,
    "int": 16,
    "wis": 18,
    "cha": 18,
    "abilities": [
      {
        "name": "Amphibious",
        "desc": "The giant can breathe air and water."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The giant's innate spellcasting ability is Charisma (spell save CD 17). It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic, feather fall, levitate, light\n3/day each: control weather, water breathing"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The giant makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 10 metros, um alvo. Hit: 30 (6d6 + 9) dano cortante."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +14 para acertar, alcance 60/240 metros, um alvo. Hit: 35 (4d12 + 9) dano de concussão."
      },
      {
        "name": "Lightning Strike",
        "desc": "The giant hurls a magical lightning bolt at a point it can see within 500 feet of it. Each creature within 10 feet of that point must make a CD 17 Dexterity teste de resistência, taking 54 (12d8) dano elétrico on a failed save, or half as much damage on a successful one."
      }
    ],
    "id": "gigante-da-tempestade",
    "tokenImageUrl": "/assets/2d/Monstros/Gigante da Tempestade.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gigante das Núvens",
    "type": "Gigante",
    "size": "Enorme",
    "alignment": "neutral good (50%) or neutral evil (50%)",
    "ac": 14,
    "hp": 200,
    "speed": "12 m",
    "cr": "9",
    "xp": 5000,
    "str": 27,
    "dex": 10,
    "con": 22,
    "int": 12,
    "wis": 16,
    "cha": 16,
    "abilities": [
      {
        "name": "Keen Smell",
        "desc": "The giant has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The giant's innate spellcasting ability is Charisma. It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic, fog cloud, light\n3/day each: feather fall, fly, misty step, telekinesis\n1/day each: control weather, gaseous form"
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The giant makes two morningstar attacks."
      },
      {
        "name": "Morningstar",
        "desc": "Ataque Corpo-a-Corpo com Arma: +12 para acertar, alcance 10 metros, um alvo. Hit: 21 (3d8 + 8) dano perfurante."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +12 para acertar, alcance 60/240 metros, um alvo. Hit: 30 (4d10 + 8) dano de concussão."
      }
    ],
    "id": "gigante-das-nuvens",
    "tokenImageUrl": "/assets/2d/Monstros/Gigante das Núvens.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gigante de Pedra",
    "type": "Gigante",
    "size": "Enorme",
    "alignment": "Neutro",
    "ac": 17,
    "hp": 126,
    "speed": "12 m",
    "cr": "7",
    "xp": 2900,
    "str": 23,
    "dex": 15,
    "con": 20,
    "int": 10,
    "wis": 12,
    "cha": 9,
    "abilities": [
      {
        "name": "Stone Camouflage",
        "desc": "The giant has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The giant makes two greatclub attacks."
      },
      {
        "name": "Greatclub",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 15 metros, um alvo. Hit: 19 (3d8 + 6) dano de concussão."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +9 para acertar, alcance 60/240 metros, um alvo. Hit: 28 (4d10 + 6) dano de concussão. If the target is a creature, it must succeed on a CD 17 Strength teste de resistência or be knocked prone."
      }
    ],
    "id": "gigante-de-pedra",
    "tokenImageUrl": "/assets/2d/Monstros/Gigante de Pedra.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gigante do Fogo",
    "type": "Gigante",
    "size": "Enorme",
    "alignment": "Leal e Mau",
    "ac": 18,
    "hp": 162,
    "speed": "9 m",
    "cr": "9",
    "xp": 5000,
    "str": 25,
    "dex": 9,
    "con": 23,
    "int": 10,
    "wis": 14,
    "cha": 13,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The giant makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 10 metros, um alvo. Hit: 28 (6d6 + 7) dano cortante."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +11 para acertar, alcance 60/240 metros, um alvo. Hit: 29 (4d10 + 7) dano de concussão."
      }
    ],
    "id": "gigante-do-fogo",
    "tokenImageUrl": "/assets/2d/Monstros/Gigante do Fogo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gigante do Gelo",
    "type": "Gigante",
    "size": "Enorme",
    "alignment": "Neutro e Mau",
    "ac": 15,
    "hp": 138,
    "speed": "12 m",
    "cr": "8",
    "xp": 3900,
    "str": 23,
    "dex": 9,
    "con": 21,
    "int": 9,
    "wis": 10,
    "cha": 12,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The giant makes two greataxe attacks."
      },
      {
        "name": "Greataxe",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 10 metros, um alvo. Hit: 25 (3d12 + 6) dano cortante."
      },
      {
        "name": "Rock",
        "desc": "Ataque à Distância com Arma: +9 para acertar, alcance 60/240 metros, um alvo. Hit: 28 (4d10 + 6) dano de concussão."
      }
    ],
    "id": "gigante-do-gelo",
    "tokenImageUrl": "/assets/2d/Monstros/Gigante do Gelo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Githyanki",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "githyanki",
    "tokenImageUrl": "/assets/2d/Monstros/Githyanki.png",
    "tokenType": "billboard"
  },
  {
    "name": "Githzerai",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "githzerai",
    "tokenImageUrl": "/assets/2d/Monstros/Githzerai.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gnoll",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 15,
    "hp": 22,
    "speed": "9 m",
    "cr": "0.5",
    "xp": 100,
    "str": 14,
    "dex": 12,
    "con": 11,
    "int": 6,
    "wis": 10,
    "cha": 7,
    "abilities": [
      {
        "name": "Rampage",
        "desc": "When the gnoll reduces a creature to 0 hit points with a melee attack on its turn, the gnoll can take a bonus action to move up to half its speed and make a bite attack."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, one creature. Hit: 4 (1d4 + 2) dano perfurante."
      },
      {
        "name": "Spear",
        "desc": "Melee or Ataque à Distância com Arma: +4 para acertar, alcance 5 metros or alcance 20/60 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante, or 6 (1d8 + 2) dano perfurante if used with two hands to make a melee attack."
      },
      {
        "name": "Longbow",
        "desc": "Ataque à Distância com Arma: +3 para acertar, alcance 150/600 metros, um alvo. Hit: 5 (1d8 + 1) dano perfurante."
      }
    ],
    "id": "gnoll",
    "tokenImageUrl": "/assets/2d/Monstros/Gnoll.png",
    "tokenType": "billboard"
  },
  {
    "name": "Golem de Barro",
    "type": "Construto",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 14,
    "hp": 133,
    "speed": "6 m",
    "cr": "9",
    "xp": 5000,
    "str": 20,
    "dex": 9,
    "con": 18,
    "int": 3,
    "wis": 8,
    "cha": 1,
    "abilities": [
      {
        "name": "Acid Absorption",
        "desc": "Whenever the golem is subjected to dano de ácido, it takes no damage and instead regains a number of hit points equal to the dano de ácido dealt."
      },
      {
        "name": "Berserk",
        "desc": "Whenever the golem starts its turn with 60 hit points or fewer, roll a d6. On a 6, the golem goes berserk. On each of its turns while berserk, the golem attacks the nearest creature it can see. If no creature is near enough to move to and attack, the golem attacks an object, with preference for an object smaller than itself. Once the golem goes berserk, it continues to do so until it is destroyed or regains all its hit points."
      },
      {
        "name": "Immutable Form",
        "desc": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Magic Resistance",
        "desc": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The golem makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 5 metros, um alvo. Hit: 16 (2d10 + 5) dano de concussão. If the target is a creature, it must succeed on a CD 15 Constitution teste de resistência or have its hit point maximum reduced by an amount equal to the damage taken. The target dies if this attack reduces its hit point maximum to 0. The reduction lasts until removed by the greater restoration spell or other magic."
      },
      {
        "name": "Haste",
        "desc": "Until the end of its next turn, the golem magically gains a +2 bonus to its AC, has advantage on Dexterity saving throws, and can use its slam attack as a bonus action."
      }
    ],
    "id": "golem-de-barro",
    "tokenImageUrl": "/assets/2d/Monstros/Golem de Barro.png",
    "tokenType": "billboard"
  },
  {
    "name": "Golem de Carne",
    "type": "Construto",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 9,
    "hp": 93,
    "speed": "9 m",
    "cr": "5",
    "xp": 1800,
    "str": 19,
    "dex": 9,
    "con": 18,
    "int": 6,
    "wis": 10,
    "cha": 5,
    "abilities": [
      {
        "name": "Berserk",
        "desc": "Whenever the golem starts its turn with 40 hit points or fewer, roll a d6. On a 6, the golem goes berserk. On each of its turns while berserk, the golem attacks the nearest creature it can see. If no creature is near enough to move to and attack, the golem attacks an object, with preference for an object smaller than itself. Once the golem goes berserk, it continues to do so until it is destroyed or regains all its hit points.\nThe golem's creator, if within 60 feet of the berserk golem, can try to calm it by speaking firmly and persuasively. The golem must be able to hear its creator, who must take an action to make a CD 15 Charisma (Persuasion) check. If the check succeeds, the golem ceases being berserk. If it takes damage while still at 40 hit points or fewer, the golem might go berserk again."
      },
      {
        "name": "Aversion of Fire",
        "desc": "If the golem takes dano de fogo, it has disadvantage on attack rolls and ability checks until the end of its next turn."
      },
      {
        "name": "Immutable Form",
        "desc": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Lightning Absorption",
        "desc": "Whenever the golem is subjected to dano elétrico, it takes no damage and instead regains a number of hit points equal to the dano elétrico dealt."
      },
      {
        "name": "Magic Resistance",
        "desc": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The golem makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano de concussão."
      }
    ],
    "id": "golem-de-carne",
    "tokenImageUrl": "/assets/2d/Monstros/Golem de Carne.png",
    "tokenType": "billboard"
  },
  {
    "name": "Golem de Ferro",
    "type": "Construto",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 20,
    "hp": 210,
    "speed": "9 m",
    "cr": "16",
    "xp": 15000,
    "str": 24,
    "dex": 9,
    "con": 20,
    "int": 3,
    "wis": 11,
    "cha": 1,
    "abilities": [
      {
        "name": "Fire Absorption",
        "desc": "Whenever the golem is subjected to dano de fogo, it takes no damage and instead regains a number of hit points equal to the dano de fogo dealt."
      },
      {
        "name": "Immutable Form",
        "desc": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Magic Resistance",
        "desc": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The golem makes two melee attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +13 para acertar, alcance 5 metros, um alvo. Hit: 20 (3d8 + 7) dano de concussão."
      },
      {
        "name": "Sword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +13 para acertar, alcance 10 metros, um alvo. Hit: 23 (3d10 + 7) dano cortante."
      },
      {
        "name": "Poison Breath",
        "desc": "The golem exhales poisonous gas in a 15-foot cone. Each creature in that area must make a CD 19 Constitution teste de resistência, taking 45 (10d8) dano de veneno on a failed save, or half as much damage on a successful one."
      }
    ],
    "id": "golem-de-ferro",
    "tokenImageUrl": "/assets/2d/Monstros/Golem de Ferro.png",
    "tokenType": "billboard"
  },
  {
    "name": "Golem de Pedra",
    "type": "Construto",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 17,
    "hp": 178,
    "speed": "9 m",
    "cr": "10",
    "xp": 5900,
    "str": 22,
    "dex": 9,
    "con": 20,
    "int": 3,
    "wis": 11,
    "cha": 1,
    "abilities": [
      {
        "name": "Immutable Form",
        "desc": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Magic Resistance",
        "desc": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The golem makes two slam attacks."
      },
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 5 metros, um alvo. Hit: 19 (3d8 + 6) dano de concussão."
      },
      {
        "name": "Slow",
        "desc": "The golem targets one or more creatures it can see within 10 metros of it. Each target must make a CD 17 Wisdom teste de resistência against this magic. On a failed save, a target can't use reactions, its speed is halved, and it can't make more than one attack on its turn. In addition, the target can take either an action or a bonus action on its turn, not both. These effects last for 1 minute. A target can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "id": "golem-de-pedra",
    "tokenImageUrl": "/assets/2d/Monstros/Golem de Pedra.png",
    "tokenType": "billboard"
  },
  {
    "name": "Gorgona",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 19,
    "hp": 114,
    "speed": "12 m",
    "cr": "5",
    "xp": 1800,
    "str": 20,
    "dex": 11,
    "con": 18,
    "int": 2,
    "wis": 12,
    "cha": 7,
    "abilities": [
      {
        "name": "Trampling Charge",
        "desc": "If the gorgon moves at least 20 feet straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a CD 16 Strength teste de resistência or be knocked prone. If the target is prone, the gorgon can make one attack with its hooves against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 5 metros, um alvo. Hit: 18 (2d12 + 5) dano perfurante."
      },
      {
        "name": "Hooves",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 5 metros, um alvo. Hit: 16 (2d10 + 5) dano de concussão."
      },
      {
        "name": "Petrifying Breath",
        "desc": "The gorgon exhales petrifying gas in a 30-foot cone. Each creature in that area must succeed on a CD 13 Constitution teste de resistência. On a failed save, a target begins to turn to stone and is restrained. The restrained target must repeat the teste de resistência at the end of its next turn. On a success, the effect ends on the target. On a failure, the target is petrified until freed by the greater restoration spell or other magic."
      }
    ],
    "id": "gorgona",
    "tokenImageUrl": "/assets/2d/Monstros/Gorgona.png",
    "tokenType": "billboard"
  },
  {
    "name": "Grifo",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 12,
    "hp": 59,
    "speed": "9 m, fly: 24 m",
    "cr": "2",
    "xp": 450,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 2,
    "wis": 13,
    "cha": 8,
    "abilities": [
      {
        "name": "Keen Sight",
        "desc": "The griffon has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The griffon makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 8 (1d8 + 4) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d6 + 4) dano cortante."
      }
    ],
    "id": "grifo",
    "tokenImageUrl": "/assets/2d/Monstros/Grifo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Guerreiro Goblin",
    "type": "Humanóide",
    "size": "Pequeno",
    "alignment": "Neutro e Mau",
    "ac": 15,
    "hp": 7,
    "speed": "9 m",
    "cr": "0.25",
    "xp": 50,
    "str": 8,
    "dex": 14,
    "con": 10,
    "int": 10,
    "wis": 8,
    "cha": 8,
    "abilities": [
      {
        "name": "Nimble Escape",
        "desc": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
      }
    ],
    "actions": [
      {
        "name": "Scimitar",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano cortante."
      },
      {
        "name": "Shortbow",
        "desc": "Ataque à Distância com Arma: +4 para acertar, alcance 80/320 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      }
    ],
    "id": "guerreiro-goblin",
    "tokenImageUrl": "/assets/2d/Monstros/Guerreiro Goblin.png",
    "tokenType": "billboard"
  },
  {
    "name": "Harpia",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 11,
    "hp": 38,
    "speed": "6 m, fly: 12 m",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 13,
    "con": 12,
    "int": 7,
    "wis": 10,
    "cha": 13,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The harpy makes two attacks: one with its claws and one with its club."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, um alvo. Hit: 6 (2d4 + 1) dano cortante."
      },
      {
        "name": "Club",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, um alvo. Hit: 3 (1d4 + 1) dano de concussão."
      },
      {
        "name": "Luring Song",
        "desc": "The harpy sings a magical melody. Every humanoid and giant within 300 metros of the harpy that can hear the song must succeed on a CD 11 Wisdom teste de resistência or be charmed until the song ends. The harpy must take a bonus action on its subsequent turns to continue singing. It can stop singing at any time. The song ends if the harpy is incapacitated.\nWhile charmed by the harpy, a target is incapacitated and ignores the songs of other harpies. If the charmed target is more than 5 metros away from the harpy, the must move on its turn toward the harpy by the most direct route. It doesn't avoid opportunity attacks, but before moving into damaging terrain, such as lava or a pit, and whenever it takes damage from a source other than the harpy, a target can repeat the teste de resistência. A creature can also repeat the teste de resistência at the end of each of its turns. If a creature's teste de resistência is successful, the effect ends on it.\nA target that successfully saves is immune to this harpy's song for the next 24 hours."
      }
    ],
    "id": "harpia",
    "tokenImageUrl": "/assets/2d/Monstros/Harpia.png",
    "tokenType": "billboard"
  },
  {
    "name": "Hidra",
    "type": "Monstruosidade",
    "size": "Enorme",
    "alignment": "Sem Alinhamento",
    "ac": 15,
    "hp": 172,
    "speed": "9 m, swim: 9 m",
    "cr": "8",
    "xp": 3900,
    "str": 20,
    "dex": 12,
    "con": 20,
    "int": 2,
    "wis": 10,
    "cha": 7,
    "abilities": [
      {
        "name": "Hold Breath",
        "desc": "The hydra can hold its breath for 1 hour."
      },
      {
        "name": "Multiple Heads",
        "desc": "The hydra has five heads. While it has more than one head, the hydra has advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious.\nWhenever the hydra takes 25 or more damage in a single turn, one of its heads dies. If all its heads die, the hydra dies.\nAt the end of its turn, it grows two heads for each of its heads that died since its last turn, unless it has taken dano de fogo since its last turn. The hydra regains 10 hit points for each head regrown in this way."
      },
      {
        "name": "Reactive Heads",
        "desc": "For each head the hydra has beyond one, it gets an extra reaction that can be used only for opportunity attacks."
      },
      {
        "name": "Wakeful",
        "desc": "While the hydra sleeps, at least one of its heads is awake."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The hydra makes as many bite attacks as it has heads."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 10 metros, um alvo. Hit: 10 (1d10 + 5) dano perfurante."
      }
    ],
    "id": "hidra",
    "tokenImageUrl": "/assets/2d/Monstros/Hidra.png",
    "tokenType": "billboard"
  },
  {
    "name": "Hipogrifo",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 11,
    "hp": 19,
    "speed": "12 m, fly: 18 m",
    "cr": "1",
    "xp": 200,
    "str": 17,
    "dex": 13,
    "con": 13,
    "int": 2,
    "wis": 12,
    "cha": 8,
    "abilities": [
      {
        "name": "Keen Sight",
        "desc": "The hippogriff has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The hippogriff makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 8 (1d10 + 3) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 10 (2d6 + 3) dano cortante."
      }
    ],
    "id": "hipogrifo",
    "tokenImageUrl": "/assets/2d/Monstros/Hipogrifo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Hobgoblin",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Leal e Mau",
    "ac": 18,
    "hp": 11,
    "speed": "9 m",
    "cr": "0.5",
    "xp": 100,
    "str": 13,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 9,
    "abilities": [
      {
        "name": "Martial Advantage",
        "desc": "Once per turn, the hobgoblin can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 metros of an ally of the hobgoblin that isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Longsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d8 + 1) dano cortante, or 6 (1d10 + 1) dano cortante if used with two hands."
      },
      {
        "name": "Longbow",
        "desc": "Ataque à Distância com Arma: +3 para acertar, alcance 150/600 metros, um alvo. Hit: 5 (1d8 + 1) dano perfurante."
      }
    ],
    "id": "hobgoblin",
    "tokenImageUrl": "/assets/2d/Monstros/Hobgoblin.png",
    "tokenType": "billboard"
  },
  {
    "name": "Homúnculo",
    "type": "Construto",
    "size": "Miúdo",
    "alignment": "Neutro",
    "ac": 13,
    "hp": 5,
    "speed": "6 m, fly: 12 m",
    "cr": "0",
    "xp": 10,
    "str": 4,
    "dex": 15,
    "con": 11,
    "int": 10,
    "wis": 10,
    "cha": 7,
    "abilities": [
      {
        "name": "Telepathic Bond",
        "desc": "While the homunculus is on the same plane of existence as its master, it can magically convey what it senses to its master, and the two can communicate telepathically."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, one creature. Hit: 1 dano perfurante, and the target must succeed on a CD 10 Constitution teste de resistência or be poisoned for 1 minute. If the teste de resistência fails by 5 or more, the target is instead poisoned for 5 (1d10) minutes and unconscious while poisoned in this way."
      }
    ],
    "id": "homunculo",
    "tokenImageUrl": "/assets/2d/Monstros/Homúnculo.png",
    "tokenType": "billboard"
  },
  {
    "name": "Horror de Gancho",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "horror-de-gancho",
    "tokenImageUrl": "/assets/2d/Monstros/Horror de Gancho.png",
    "tokenType": "billboard"
  },
  {
    "name": "Imp",
    "type": "Ínfero",
    "size": "Miúdo",
    "alignment": "Leal e Mau",
    "ac": 13,
    "hp": 10,
    "speed": "6 m, fly: 12 m",
    "cr": "1",
    "xp": 200,
    "str": 6,
    "dex": 17,
    "con": 13,
    "int": 11,
    "wis": 12,
    "cha": 14,
    "abilities": [
      {
        "name": "Shapechanger",
        "desc": "The imp can use its action to polymorph into a beast form that resembles a rat (speed 20 metros), a raven (20 metros, fly 60 metros), or a spider (20 metros, climb 20 metros), or back into its true form. Its statistics are the same in each form, except for the speed changes noted. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Devil's Sight",
        "desc": "Magical darkness doesn't impede the imp's darkvision."
      },
      {
        "name": "Magic Resistance",
        "desc": "The imp has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Sting (Bite in Beast Form)",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d4 + 3) dano perfurante, and the target must make on a CD 11 Constitution teste de resistência, taking 10 (3d6) dano de veneno on a failed save, or half as much damage on a successful one."
      },
      {
        "name": "Invisibility",
        "desc": "The imp magically turns invisible until it attacks, or until its concentration ends (as if concentrating on a spell). Any equipment the imp wears or carries is invisible with it."
      }
    ],
    "id": "imp",
    "tokenImageUrl": "/assets/2d/Monstros/Imp.png",
    "tokenType": "billboard"
  },
  {
    "name": "Incubus",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "incubus",
    "tokenImageUrl": "/assets/2d/Monstros/Incubus.png",
    "tokenType": "billboard"
  },
  {
    "name": "Kobold",
    "type": "Humanóide",
    "size": "Pequeno",
    "alignment": "Leal e Mau",
    "ac": 12,
    "hp": 5,
    "speed": "9 m",
    "cr": "0.125",
    "xp": 25,
    "str": 7,
    "dex": 15,
    "con": 9,
    "int": 8,
    "wis": 7,
    "cha": 8,
    "abilities": [
      {
        "name": "Sunlight Sensitivity",
        "desc": "While in sunlight, the kobold has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      },
      {
        "name": "Pack Tactics",
        "desc": "The kobold has advantage on an attack roll against a creature if at least one of the kobold's allies is within 5 metros of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Dagger",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 4 (1d4 + 2) dano perfurante."
      },
      {
        "name": "Sling",
        "desc": "Ataque à Distância com Arma: +4 para acertar, alcance 30/120 metros, um alvo. Hit: 4 (1d4 + 2) dano de concussão."
      }
    ],
    "id": "kobold",
    "tokenImageUrl": "/assets/2d/Monstros/Kobold.png",
    "tokenType": "billboard"
  },
  {
    "name": "Kua Tao",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "kua-tao",
    "tokenImageUrl": "/assets/2d/Monstros/Kua Tao.png",
    "tokenType": "billboard"
  },
  {
    "name": "Lich",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "any evil alignment",
    "ac": 17,
    "hp": 135,
    "speed": "9 m",
    "cr": "21",
    "xp": 33000,
    "str": 11,
    "dex": 16,
    "con": 16,
    "int": 20,
    "wis": 14,
    "cha": 16,
    "abilities": [
      {
        "name": "Legendary Resistance",
        "desc": "If the lich fails a teste de resistência, it can choose to succeed instead."
      },
      {
        "name": "Rejuvenation",
        "desc": "If it has a phylactery, a destroyed lich gains a new body in 1d10 days, regaining all its hit points and becoming active again. The new body appears within 5 feet of the phylactery."
      },
      {
        "name": "Spellcasting",
        "desc": "The lich is an 18th-level spellcaster. Its spellcasting ability is Intelligence (spell save CD 20, +12 para acertar with spell attacks). The lich has the following wizard spells prepared:\n\n- Cantrips (at will): mage hand, prestidigitation, ray of frost\n- 1st level (4 slots): detect magic, magic missile, shield, thunderwave\n- 2nd level (3 slots): acid arrow, detect thoughts, invisibility, mirror image\n- 3rd level (3 slots): animate dead, counterspell, dispel magic, fireball\n- 4th level (3 slots): blight, dimension door\n- 5th level (3 slots): cloudkill, scrying\n- 6th level (1 slot): disintegrate, globe of invulnerability\n- 7th level (1 slot): finger of death, plane shift\n- 8th level (1 slot): dominate monster, power word stun\n- 9th level (1 slot): power word kill"
      },
      {
        "name": "Turn Resistance",
        "desc": "The lich has advantage on saving throws against any effect that turns undead."
      }
    ],
    "actions": [
      {
        "name": "Paralyzing Touch",
        "desc": "Melee Spell Attack: +12 para acertar, alcance 5 metros, one creature. Hit: 10 (3d6) dano de frio. The target must succeed on a CD 18 Constitution teste de resistência or be paralyzed for 1 minute. The target can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "id": "lich",
    "tokenImageUrl": "/assets/2d/Monstros/Lich.png",
    "tokenType": "billboard"
  },
  {
    "name": "Lívido",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 13,
    "hp": 36,
    "speed": "9 m",
    "cr": "2",
    "xp": 450,
    "str": 16,
    "dex": 17,
    "con": 10,
    "int": 11,
    "wis": 10,
    "cha": 8,
    "abilities": [
      {
        "name": "Stench",
        "desc": "Any creature that starts its turn within 5 metros of the ghast must succeed on a CD 10 Constitution teste de resistência or be poisoned until the start of its next turn. On a successful teste de resistência, the creature is immune to the ghast's Stench for 24 hours."
      },
      {
        "name": "Turn Defiance",
        "desc": "The ghast and any ghouls within 30 metros of it have advantage on saving throws against effects that turn undead."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, one creature. Hit: 12 (2d8 + 3) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 10 (2d6 + 3) dano cortante. If the target is a creature other than an undead, it must succeed on a CD 10 Constitution teste de resistência or be paralyzed for 1 minute. The target can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "id": "livido",
    "tokenImageUrl": "/assets/2d/Monstros/Lívido.png",
    "tokenType": "billboard"
  },
  {
    "name": "Manticora",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Leal e Mau",
    "ac": 14,
    "hp": 68,
    "speed": "9 m, fly: 15 m",
    "cr": "3",
    "xp": 700,
    "str": 17,
    "dex": 16,
    "con": 17,
    "int": 7,
    "wis": 12,
    "cha": 8,
    "abilities": [
      {
        "name": "Tail Spike Regrowth",
        "desc": "The manticore has twenty-four tail spikes. Used spikes regrow when the manticore finishes a long rest."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The manticore makes three attacks: one with its bite and two with its claws or three with its tail spikes."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 7 (1d8 + 3) dano perfurante."
      },
      {
        "name": "Claw",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 6 (1d6 + 3) dano cortante."
      },
      {
        "name": "Tail Spike",
        "desc": "Ataque à Distância com Arma: +5 para acertar, alcance 100/200 metros, um alvo. Hit: 7 (1d8 + 3) dano perfurante."
      }
    ],
    "id": "manticora",
    "tokenImageUrl": "/assets/2d/Monstros/Manticora.png",
    "tokenType": "billboard"
  },
  {
    "name": "Marilith",
    "type": "Ínfero",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 18,
    "hp": 189,
    "speed": "12 m",
    "cr": "16",
    "xp": 15000,
    "str": 18,
    "dex": 20,
    "con": 20,
    "int": 18,
    "wis": 16,
    "cha": 20,
    "abilities": [
      {
        "name": "Magic Resistance",
        "desc": "The marilith has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The marilith's weapon attacks are magical."
      },
      {
        "name": "Reactive",
        "desc": "The marilith can take one reaction on every turn in combat."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The marilith can make seven attacks: six with its longswords and one with its tail."
      },
      {
        "name": "Longsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano cortante."
      },
      {
        "name": "Tail",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 10 metros, one creature. Hit: 15 (2d10 + 4) dano de concussão. If the target is Medium or smaller, it is grappled (escape CD 19). Until this grapple ends, the target is restrained, the marilith can automatically hit the target with its tail, and the marilith can't make tail attacks against other targets."
      },
      {
        "name": "Teleport",
        "desc": "The marilith magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      }
    ],
    "id": "marilith",
    "tokenImageUrl": "/assets/2d/Monstros/Marilith.png",
    "tokenType": "billboard"
  },
  {
    "name": "Medusa",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Leal e Mau",
    "ac": 15,
    "hp": 127,
    "speed": "9 m",
    "cr": "6",
    "xp": 2300,
    "str": 10,
    "dex": 15,
    "con": 16,
    "int": 12,
    "wis": 13,
    "cha": 15,
    "abilities": [
      {
        "name": "Petrifying Gaze",
        "desc": "When a creature that can see the medusa's eyes starts its turn within 30 metros of the medusa, the medusa can force it to make a CD 14 Constitution teste de resistência if the medusa isn't incapacitated and can see the creature. If the teste de resistência fails by 5 or more, the creature is instantly petrified. Otherwise, a creature that fails the save begins to turn to stone and is restrained. The restrained creature must repeat the teste de resistência at the end of its next turn, becoming petrified on a failure or ending the effect on a success. The petrification lasts until the creature is freed by the greater restoration spell or other magic.\nUnless surprised, a creature can avert its eyes to avoid the teste de resistência at the start of its turn. If the creature does so, it can't see the medusa until the start of its next turn, when it can avert its eyes again. If the creature looks at the medusa in the meantime, it must immediately make the save.\nIf the medusa sees itself reflected on a polished surface within 30 metros of it and in an area of bright light, the medusa is, due to its curse, affected by its own gaze."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The medusa makes either three melee attacks--one with its snake hair and two with its shortsword--or two ranged attacks with its longbow."
      },
      {
        "name": "Snake Hair",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, one creature. Hit: 4 (1d4 + 2) dano perfurante mais 14 (4d6) dano de veneno."
      },
      {
        "name": "Shortsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      },
      {
        "name": "Longbow",
        "desc": "Ataque à Distância com Arma: +5 para acertar, alcance 150/600 metros, um alvo. Hit: 6 (1d8 + 2) dano perfurante mais 7 (2d6) dano de veneno."
      }
    ],
    "id": "medusa",
    "tokenImageUrl": "/assets/2d/Monstros/Medusa.png",
    "tokenType": "billboard"
  },
  {
    "name": "Merrow",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 13,
    "hp": 45,
    "speed": "3 m, swim: 12 m",
    "cr": "2",
    "xp": 450,
    "str": 18,
    "dex": 10,
    "con": 15,
    "int": 8,
    "wis": 10,
    "cha": 9,
    "abilities": [
      {
        "name": "Amphibious",
        "desc": "The merrow can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The merrow makes two attacks: one with its bite and one with its claws or harpoon."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 8 (1d8 + 4) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 9 (2d4 + 4) dano cortante."
      },
      {
        "name": "Harpoon",
        "desc": "Melee or Ataque à Distância com Arma: +6 para acertar, alcance 5 metros or alcance 20/60 metros, um alvo. Hit: 11 (2d6 + 4) dano perfurante. If the target is a Huge or smaller creature, it must succeed on a Strength contest against the merrow or be pulled up to 20 feet toward the merrow."
      }
    ],
    "id": "merrow",
    "tokenImageUrl": "/assets/2d/Monstros/Merrow.png",
    "tokenType": "billboard"
  },
  {
    "name": "Mimico",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 58,
    "speed": "5 m",
    "cr": "2",
    "xp": 450,
    "str": 17,
    "dex": 12,
    "con": 15,
    "int": 5,
    "wis": 13,
    "cha": 8,
    "abilities": [
      {
        "name": "Shapechanger",
        "desc": "The mimic can use its action to polymorph into an object or back into its true, amorphous form. Its statistics are the same in each form. Any equipment it is wearing or carrying isn 't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Adhesive (Object Form Only)",
        "desc": "The mimic adheres to anything that touches it. A Huge or smaller creature adhered to the mimic is also grappled by it (escape CD 13). Ability checks made to escape this grapple have disadvantage."
      },
      {
        "name": "False Appearance (Object Form Only)",
        "desc": "While the mimic remains motionless, it is indistinguishable from an ordinary object."
      },
      {
        "name": "Grappler",
        "desc": "The mimic has advantage on attack rolls against any creature grappled by it."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 7 (1d8 + 3) dano de concussão. If the mimic is in object form, the target is subjected to its Adhesive trait."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 7 (1d8 + 3) dano perfurante mais 4 (1d8) dano de ácido."
      }
    ],
    "id": "mimico",
    "tokenImageUrl": "/assets/2d/Monstros/Mimico.png",
    "tokenType": "billboard"
  },
  {
    "name": "Minotauro",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 14,
    "hp": 76,
    "speed": "12 m",
    "cr": "3",
    "xp": 700,
    "str": 18,
    "dex": 11,
    "con": 16,
    "int": 6,
    "wis": 16,
    "cha": 9,
    "abilities": [
      {
        "name": "Charge",
        "desc": "If the minotaur moves at least 10 metros straight toward a target and then hits it with a gore attack on the same turn, the target takes an extra 9 (2d8) dano perfurante. If the target is a creature, it must succeed on a CD 14 Strength teste de resistência or be pushed up to 10 metros away and knocked prone."
      },
      {
        "name": "Labyrinthine Recall",
        "desc": "The minotaur can perfectly recall any path it has traveled."
      },
      {
        "name": "Reckless",
        "desc": "At the start of its turn, the minotaur can gain advantage on all Ataque Corpo-a-Corpo com Arma rolls it makes during that turn, but attack rolls against it have advantage until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 17 (2d12 + 4) dano cortante."
      },
      {
        "name": "Gore",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano perfurante."
      }
    ],
    "id": "minotauro",
    "tokenImageUrl": "/assets/2d/Monstros/Minotauro.png",
    "tokenType": "billboard"
  },
  {
    "name": "Mostro da Ferrugem",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Sem Alinhamento",
    "ac": 14,
    "hp": 27,
    "speed": "12 m",
    "cr": "0.5",
    "xp": 100,
    "str": 13,
    "dex": 12,
    "con": 13,
    "int": 2,
    "wis": 13,
    "cha": 6,
    "abilities": [
      {
        "name": "Iron Scent",
        "desc": "The rust monster can pinpoint, by scent, the location of ferrous metal within 30 feet of it."
      },
      {
        "name": "Rust Metal",
        "desc": "Any nonmagical weapon made of metal that hits the rust monster corrodes. After dealing damage, the weapon takes a permanent and cumulative -1 penalty to damage rolls. If its penalty drops to -5, the weapon is destroyed. Nonmagical ammunition made of metal that hits the rust monster is destroyed after dealing damage."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d8 + 1) dano perfurante."
      },
      {
        "name": "Antennae",
        "desc": "The rust monster corrodes a nonmagical ferrous metal object it can see within 5 feet of it. If the object isn't being worn or carried, the touch destroys a 1-foot cube of it. If the object is being worn or carried by a creature, the creature can make a CD 11 Dexterity teste de resistência to avoid the rust monster's touch.\nIf the object touched is either metal armor or a metal shield being worn or carried, its takes a permanent and cumulative -1 penalty to the AC it offers. Armor reduced to an AC of 10 or a shield that drops to a +0 bonus is destroyed. If the object touched is a held metal weapon, it rusts as described in the Rust Metal trait."
      }
    ],
    "id": "mostro-da-ferrugem",
    "tokenImageUrl": "/assets/2d/Monstros/Mostro da Ferrugem.png",
    "tokenType": "billboard"
  },
  {
    "name": "Mumia",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Leal e Mau",
    "ac": 11,
    "hp": 58,
    "speed": "6 m",
    "cr": "3",
    "xp": 700,
    "str": 16,
    "dex": 8,
    "con": 15,
    "int": 6,
    "wis": 10,
    "cha": 12,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The mummy can use its Dreadful Glare and makes one attack with its rotting fist."
      },
      {
        "name": "Rotting Fist",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 10 (2d6 + 3) dano de concussão mais 10 (3d6) dano necrótico. If the target is a creature, it must succeed on a CD 12 Constitution teste de resistência or be cursed with mummy rot. The cursed target can't regain hit points, and its hit point maximum decreases by 10 (3d6) for every 24 hours that elapse. If the curse reduces the target's hit point maximum to 0, the target dies, and its body turns to dust. The curse lasts until removed by the remove curse spell or other magic."
      },
      {
        "name": "Dreadful Glare",
        "desc": "The mummy targets one creature it can see within 60 metros of it. If the target can see the mummy, it must succeed on a CD 11 Wisdom teste de resistência against this magic or become frightened until the end of the mummy's next turn. If the target fails the teste de resistência by 5 or more, it is also paralyzed for the same duration. A target that succeeds on the teste de resistência is immune to the Dreadful Glare of all mummies (but not mummy lords) for the next 24 hours."
      }
    ],
    "id": "mumia",
    "tokenImageUrl": "/assets/2d/Monstros/Mumia.png",
    "tokenType": "billboard"
  },
  {
    "name": "Naga",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 15,
    "hp": 75,
    "speed": "12 m",
    "cr": "8",
    "xp": 3900,
    "str": 18,
    "dex": 17,
    "con": 14,
    "int": 16,
    "wis": 15,
    "cha": 16,
    "abilities": [
      {
        "name": "Rejuvenation",
        "desc": "If it dies, the naga returns to life in 1d6 days and regains all its hit points. Only a wish spell can prevent this trait from functioning."
      },
      {
        "name": "Spellcasting",
        "desc": "The naga is a 10th-level spellcaster. Its spellcasting ability is Intelligence (spell save CD 14, +6 para acertar with spell attacks), and it needs only verbal components to cast its spells. It has the following wizard spells prepared:\n\n- Cantrips (at will): mage hand, minor illusion, ray of frost\n- 1st level (4 slots): charm person, detect magic, sleep\n- 2nd level (3 slots): detect thoughts, hold person\n- 3rd level (3 slots): lightning bolt, water breathing\n- 4th level (3 slots): blight, dimension door\n- 5th level (2 slots): dominate person"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 10 metros, one creature. Hit: 7 (1d6 + 4) dano perfurante, and the target must make a CD 13 Constitution teste de resistência, taking 31 (7d8) dano de veneno on a failed save, or half as much damage on a successful one."
      }
    ],
    "id": "naga",
    "tokenImageUrl": "/assets/2d/Monstros/Naga.png",
    "tokenType": "billboard"
  },
  {
    "name": "Ogro",
    "type": "Gigante",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 11,
    "hp": 59,
    "speed": "12 m",
    "cr": "2",
    "xp": 450,
    "str": 19,
    "dex": 8,
    "con": 16,
    "int": 5,
    "wis": 7,
    "cha": 7,
    "abilities": [],
    "actions": [
      {
        "name": "Greatclub",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano de concussão."
      },
      {
        "name": "Javelin",
        "desc": "Melee or Ataque à Distância com Arma: +6 para acertar, alcance 5 metros or alcance 30/120 metros, um alvo. Hit: 11 (2d6 + 4) dano perfurante."
      }
    ],
    "id": "ogro",
    "tokenImageUrl": "/assets/2d/Monstros/Ogro.png",
    "tokenType": "billboard"
  },
  {
    "name": "Orc",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Caótico e Mau",
    "ac": 13,
    "hp": 15,
    "speed": "9 m",
    "cr": "0.5",
    "xp": 100,
    "str": 16,
    "dex": 12,
    "con": 16,
    "int": 7,
    "wis": 11,
    "cha": 10,
    "abilities": [
      {
        "name": "Aggressive",
        "desc": "As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "desc": "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 5 metros, um alvo. Hit: 9 (1d12 + 3) dano cortante."
      },
      {
        "name": "Javelin",
        "desc": "Melee or Ataque à Distância com Arma: +5 para acertar, alcance 5 metros or alcance 30/120 metros, um alvo. Hit: 6 (1d6 + 3) dano perfurante."
      }
    ],
    "id": "orc",
    "tokenImageUrl": "/assets/2d/Monstros/Orc.png",
    "tokenType": "billboard"
  },
  {
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Leal e Mau",
    "ac": 13,
    "hp": 85,
    "speed": "12m (40ft)",
    "cr": "3",
    "xp": 700,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 6,
    "wis": 12,
    "cha": 8,
    "abilities": [
      {
        "name": "Deslocamento",
        "desc": "A pantera projeta uma ilusão mágica que faz com que ela pareça estar a alguns metros de sua localização real. Ataques contra ela têm desvantagem. Se for atingida por um ataque, esta característica é desativada até o início de seu próximo turno."
      },
      {
        "name": "Esquiva Sobrenatural",
        "desc": "Quando a pantera for submetida a um efeito que permite um teste de resistência de Destreza para sofrer apenas metade do dano, ela não sofrerá dano se passar, e apenas metade se falhar."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "A pantera faz dois ataques com seus tentáculos."
      },
      {
        "name": "Tentáculo",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 3m, um alvo. Acerto: 7 (1d6 + 4) de dano cortante mais 3 (1d6) de dano de força."
      }
    ],
    "name": "Pantera Deslocadora",
    "id": "pantera-deslocadora",
    "tokenImageUrl": "/assets/2d/Monstros/Pantera Deslocadora.png",
    "tokenType": "billboard"
  },
  {
    "name": "Pegasus",
    "type": "Celestial",
    "size": "Grande",
    "alignment": "Caótico e Bom",
    "ac": 12,
    "hp": 59,
    "speed": "18 m, fly: 27 m",
    "cr": "2",
    "xp": 450,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 10,
    "wis": 15,
    "cha": 13,
    "abilities": [],
    "actions": [
      {
        "name": "Hooves",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d6 + 4) dano de concussão."
      }
    ],
    "id": "pegasus",
    "tokenImageUrl": "/assets/2d/Monstros/Pegasus.png",
    "tokenType": "billboard"
  },
  {
    "name": "Peryton",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "peryton",
    "tokenImageUrl": "/assets/2d/Monstros/Peryton.png",
    "tokenType": "billboard"
  },
  {
    "name": "Povo Lagarto",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 13,
    "hp": 22,
    "speed": "9 m, swim: 9 m",
    "cr": "0.5",
    "xp": 100,
    "str": 15,
    "dex": 10,
    "con": 13,
    "int": 7,
    "wis": 12,
    "cha": 7,
    "abilities": [
      {
        "name": "Hold Breath",
        "desc": "The lizardfolk can hold its breath for 15 minutes."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The lizardfolk makes two melee attacks, each one with a different weapon."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      },
      {
        "name": "Heavy Club",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano de concussão."
      },
      {
        "name": "Javelin",
        "desc": "Melee or Ataque à Distância com Arma: +4 para acertar, alcance 5 metros or alcance 30/120 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      },
      {
        "name": "Spiked Shield",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d6 + 2) dano perfurante."
      }
    ],
    "id": "povo-lagarto",
    "tokenImageUrl": "/assets/2d/Monstros/Povo Lagarto.png",
    "tokenType": "billboard"
  },
  {
    "name": "Prole Vampirica",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Neutro e Mau",
    "ac": 15,
    "hp": 82,
    "speed": "9 m",
    "cr": "5",
    "xp": 1800,
    "str": 16,
    "dex": 16,
    "con": 16,
    "int": 11,
    "wis": 10,
    "cha": 12,
    "abilities": [
      {
        "name": "Regeneration",
        "desc": "The vampire regains 10 hit points at the start of its turn if it has at least 1 hit point and isn't in sunlight or running water. If the vampire takes radiant damage or damage from holy water, this trait doesn't function at the start of the vampire's next turn."
      },
      {
        "name": "Spider Climb",
        "desc": "The vampire can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Vampire Weaknesses",
        "desc": "The vampire has the following flaws:\nForbiddance. The vampire can't enter a residence without an invitation from one of the occupants.\nHarmed by Running Water. The vampire takes 20 dano de ácido when it ends its turn in running water.\nStake to the Heart. The vampire is destroyed if a piercing weapon made of wood is driven into its heart while it is incapacitated in its resting place.\nSunlight Hypersensitivity. The vampire takes 20 radiant damage when it starts its turn in sunlight. While in sunlight, it has disadvantage on attack rolls and ability checks."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The vampire makes two attacks, only one of which can be a bite attack."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, one willing creature, or a creature that is grappled by the vampire, incapacitated, or restrained. Hit: 6 (1d6 + 3) dano perfurante mais 7 (2d6) dano necrótico. The target's hit point maximum is reduced by an amount equal to the dano necrótico taken, and the vampire regains hit points equal to that amount. The reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 5 metros, one creature. Hit: 8 (2d4 + 3) dano cortante. Instead of dealing damage, the vampire can grapple the target (escape CD 13)."
      }
    ],
    "id": "prole-vampirica",
    "tokenImageUrl": "/assets/2d/Monstros/Prole Vampirica.png",
    "tokenType": "billboard"
  },
  {
    "name": "Quasit",
    "type": "Ínfero",
    "size": "Miúdo",
    "alignment": "Caótico e Mau",
    "ac": 13,
    "hp": 7,
    "speed": "12 m",
    "cr": "1",
    "xp": 200,
    "str": 5,
    "dex": 17,
    "con": 10,
    "int": 7,
    "wis": 10,
    "cha": 10,
    "abilities": [
      {
        "name": "Shapechanger",
        "desc": "The quasit can use its action to polymorph into a beast form that resembles a bat (speed 10 metros fly 40 metros), a centipede (40 metros, climb 40 metros), or a toad (40 metros, swim 40 metros), or back into its true form . Its statistics are the same in each form, except for the speed changes noted. Any equipment it is wearing or carrying isn't transformed . It reverts to its true form if it dies."
      },
      {
        "name": "Magic Resistance",
        "desc": "The quasit has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Claw (Bite in Beast Form)",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 5 (1d4 + 3) dano perfurante, and the target must succeed on a CD 10 Constitution teste de resistência or take 5 (2d4) dano de veneno and become poisoned for 1 minute. The target can repeat the teste de resistência at the end of each of its turns, ending the effect on itself on a success."
      },
      {
        "name": "Scare",
        "desc": "One creature of the quasit's choice within 20 metros of it must succeed on a CD 10 Wisdom teste de resistência or be frightened for 1 minute. The target can repeat the teste de resistência at the end of each of its turns, with disadvantage if the quasit is within line of sight, ending the effect on itself on a success."
      },
      {
        "name": "Invisibility",
        "desc": "The quasit magically turns invisible until it attacks or uses Scare, or until its concentration ends (as if concentrating on a spell). Any equipment the quasit wears or carries is invisible with it."
      }
    ],
    "id": "quasit",
    "tokenImageUrl": "/assets/2d/Monstros/Quasit.png",
    "tokenType": "billboard"
  },
  {
    "name": "Quimera",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 14,
    "hp": 114,
    "speed": "9 m, fly: 18 m",
    "cr": "6",
    "xp": 2300,
    "str": 19,
    "dex": 11,
    "con": 19,
    "int": 3,
    "wis": 14,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The chimera makes three attacks: one with its bite, one with its horns, and one with its claws. When its fire breath is available, it can use the breath in place of its bite or horns."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d6 + 4) dano perfurante."
      },
      {
        "name": "Horns",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 10 (1d12 + 4) dano de concussão."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d6 + 4) dano cortante."
      },
      {
        "name": "Fire Breath",
        "desc": "The dragon head exhales fire in a 15-foot cone. Each creature in that area must make a CD 15 Dexterity teste de resistência, taking 31 (7d8) dano de fogo on a failed save, or half as much damage on a successful one."
      }
    ],
    "id": "quimera",
    "tokenImageUrl": "/assets/2d/Monstros/Quimera.png",
    "tokenType": "billboard"
  },
  {
    "name": "Rato Gigante",
    "type": "Besta",
    "size": "Pequeno",
    "alignment": "Sem Alinhamento",
    "ac": 12,
    "hp": 7,
    "speed": "9 m",
    "cr": "0.125",
    "xp": 25,
    "str": 7,
    "dex": 15,
    "con": 11,
    "int": 2,
    "wis": 10,
    "cha": 4,
    "abilities": [
      {
        "name": "Keen Smell",
        "desc": "The rat has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pack Tactics",
        "desc": "The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 metros of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 5 metros, um alvo. Hit: 4 (1d4 + 2) dano perfurante."
      }
    ],
    "id": "rato-gigante",
    "tokenImageUrl": "/assets/2d/Monstros/Rato Gigante.png",
    "tokenType": "billboard"
  },
  {
    "name": "Sereia",
    "type": "Humanóide",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 11,
    "hp": 11,
    "speed": "3 m, swim: 12 m",
    "cr": "0.125",
    "xp": 25,
    "str": 10,
    "dex": 13,
    "con": 12,
    "int": 11,
    "wis": 11,
    "cha": 12,
    "abilities": [
      {
        "name": "Amphibious",
        "desc": "The merfolk can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Spear",
        "desc": "Melee or Ataque à Distância com Arma: +2 para acertar, alcance 5 metros or alcance 20/60 metros, um alvo. Hit: 3 (1d6) dano perfurante, or 4 (1d8) dano perfurante if used with two hands to make a melee attack."
      }
    ],
    "id": "sereia",
    "tokenImageUrl": "/assets/2d/Monstros/Sereia.png",
    "tokenType": "billboard"
  },
  {
    "name": "Sprite",
    "type": "Fada",
    "size": "Miúdo",
    "alignment": "Neutro e Bom",
    "ac": 15,
    "hp": 2,
    "speed": "3 m, fly: 12 m",
    "cr": "0.25",
    "xp": 50,
    "str": 3,
    "dex": 18,
    "con": 10,
    "int": 14,
    "wis": 13,
    "cha": 11,
    "abilities": [],
    "actions": [
      {
        "name": "Longsword",
        "desc": "Ataque Corpo-a-Corpo com Arma: +2 para acertar, alcance 5 metros, um alvo. Hit: 1 dano cortante."
      },
      {
        "name": "Shortbow",
        "desc": "Ataque à Distância com Arma: +6 para acertar, alcance 40/160 metros, um alvo. Hit: 1 dano perfurante, and the target must succeed on a CD 10 Constitution teste de resistência or become poisoned for 1 minute. If its teste de resistência result is 5 or lower, the poisoned target falls unconscious for the same duration, or until it takes damage or another creature takes an action to shake it awake."
      },
      {
        "name": "Heart Sight",
        "desc": "The sprite touches a creature and magically knows the creature's current emotional state. If the target fails a CD 10 Charisma teste de resistência, the sprite also knows the creature's alignment. Celestials, fiends, and undead automatically fail the teste de resistência."
      },
      {
        "name": "Invisibility",
        "desc": "The sprite magically turns invisible until it attacks or casts a spell, or until its concentration ends (as if concentrating on a spell). Any equipment the sprite wears or carries is invisible with it."
      }
    ],
    "id": "sprite",
    "tokenImageUrl": "/assets/2d/Monstros/Sprite.png",
    "tokenType": "billboard"
  },
  {
    "name": "Sucubus",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "sucubus",
    "tokenImageUrl": "/assets/2d/Monstros/Sucubus.png",
    "tokenType": "billboard"
  },
  {
    "name": "Tritão",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "tritao",
    "tokenImageUrl": "/assets/2d/Monstros/Tritão.png",
    "tokenType": "billboard"
  },
  {
    "name": "Troll",
    "type": "Gigante",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 15,
    "hp": 84,
    "speed": "9 m",
    "cr": "5",
    "xp": 1800,
    "str": 18,
    "dex": 13,
    "con": 20,
    "int": 7,
    "wis": 9,
    "cha": 7,
    "abilities": [
      {
        "name": "Keen Smell",
        "desc": "The troll has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Regeneration",
        "desc": "The troll regains 10 hit points at the start of its turn. If the troll takes acid or dano de fogo, this trait doesn't function at the start of the troll's next turn. The troll dies only if it starts its turn with 0 hit points and doesn't regenerate."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The troll makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 7 (1d6 + 4) dano perfurante."
      },
      {
        "name": "Claw",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 11 (2d6 + 4) dano cortante."
      }
    ],
    "id": "troll",
    "tokenImageUrl": "/assets/2d/Monstros/Troll.png",
    "tokenType": "billboard"
  },
  {
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Caótico e Mau",
    "ac": 18,
    "hp": 93,
    "speed": "9m (30ft), escavação 6m",
    "cr": "5",
    "xp": 1800,
    "str": 20,
    "dex": 13,
    "con": 16,
    "int": 9,
    "wis": 10,
    "cha": 10,
    "abilities": [
      {
        "name": "Olhar Confuso",
        "desc": "Quando uma criatura inicia seu turno a até 9 metros do umber hulk e os dois podem se ver, o umber hulk pode forçar a criatura a fazer um teste de resistência de Carisma CD 15. Em caso de falha, a criatura fica Confusa até o início do seu próximo turno."
      },
      {
        "name": "Tuneladora",
        "desc": "O umber hulk pode escavar através de rocha sólida, deixando um túnel de 1.5 metros de diâmetro atrás de si."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "O umber hulk faz três ataques: dois com suas garras e um com sua mordida."
      },
      {
        "name": "Garra",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 1.5m, um alvo. Acerto: 9 (1d8 + 5) de dano cortante."
      },
      {
        "name": "Mordida",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 1.5m, um alvo. Acerto: 14 (2d8 + 5) de dano perfurante."
      }
    ],
    "name": "Umber Hulk",
    "id": "umber-hulk",
    "tokenImageUrl": "/assets/2d/Monstros/Umber Hulk.png",
    "tokenType": "billboard"
  },
  {
    "name": "Urso-Coruja",
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 13,
    "hp": 59,
    "speed": "12 m",
    "cr": "3",
    "xp": 700,
    "str": 20,
    "dex": 12,
    "con": 17,
    "int": 3,
    "wis": 12,
    "cha": 7,
    "abilities": [
      {
        "name": "Keen Sight and Smell",
        "desc": "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The owlbear makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, one creature. Hit: 10 (1d10 + 5) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 14 (2d8 + 5) dano cortante."
      }
    ],
    "id": "urso-coruja",
    "tokenImageUrl": "/assets/2d/Monstros/Urso-Coruja.png",
    "tokenType": "billboard"
  },
  {
    "name": "Vampiro",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "vampiro",
    "tokenImageUrl": "/assets/2d/Monstros/Vampiro.png",
    "tokenType": "billboard"
  },
  {
    "type": "Monstruosidade",
    "size": "Grande",
    "alignment": "Neutro",
    "ac": 13,
    "hp": 51,
    "speed": "9m (30ft), escalada 9m",
    "cr": "2",
    "xp": 450,
    "str": 14,
    "dex": 13,
    "con": 16,
    "int": 1,
    "wis": 12,
    "cha": 5,
    "abilities": [
      {
        "name": "Faro Aguçado",
        "desc": "O verme da carniça tem vantagem em testes de Sabedoria (Percepção) que dependam do olfato."
      },
      {
        "name": "Escalada de Aranha",
        "desc": "O verme da carniça pode escalar superfícies difíceis, incluindo de cabeça para baixo em tetos, sem a necessidade de um teste de habilidade."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "O verme faz dois ataques: um com seus tentáculos e um com sua mordida."
      },
      {
        "name": "Tentáculos",
        "desc": "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 3m, um alvo. Acerto: 4 (1d4 + 2) de dano de concussão, e o alvo deve passar em um teste de resistência de Constituição CD 13 ou ficará envenenado por 1 minuto. Enquanto envenenado desta forma, o alvo também fica paralisado."
      },
      {
        "name": "Mordida",
        "desc": "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 1.5m, um alvo. Acerto: 7 (2d4 + 2) de dano perfurante."
      }
    ],
    "name": "Verme da Carniça",
    "id": "verme-da-carnica",
    "tokenImageUrl": "/assets/2d/Monstros/Verme da Carniça.png",
    "tokenType": "billboard"
  },
  {
    "name": "Verme Purpura",
    "type": "Monstruosidade",
    "size": "Imenso",
    "alignment": "Sem Alinhamento",
    "ac": 18,
    "hp": 247,
    "speed": "15 m, burrow: 9 m",
    "cr": "15",
    "xp": 13000,
    "str": 28,
    "dex": 7,
    "con": 22,
    "int": 1,
    "wis": 8,
    "cha": 4,
    "abilities": [
      {
        "name": "Tunneler",
        "desc": "The worm can burrow through solid rock at half its burrow speed and leaves a 10-foot-diameter tunnel in its wake."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The worm makes two attacks: one with its bite and one with its stinger."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 10 metros, um alvo. Hit: 22 (3d8 + 9) dano perfurante. If the target is a Large or smaller creature, it must succeed on a CD 19 Dexterity teste de resistência or be swallowed by the worm. A swallowed creature is blinded and restrained, it has total cover against attacks and other effects outside the worm, and it takes 21 (6d6) dano de ácido at the start of each of the worm's turns.\nIf the worm takes 30 damage or more on a single turn from a creature inside it, the worm must succeed on a CD 21 Constitution teste de resistência at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the worm. If the worm dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 20 feet of movement, exiting prone."
      },
      {
        "name": "Tail Stinger",
        "desc": "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 10 metros, one creature. Hit: 19 (3d6 + 9) dano perfurante, and the target must make a CD 19 Constitution teste de resistência, taking 42 (12d6) dano de veneno on a failed save, or half as much damage on a successful one."
      }
    ],
    "id": "verme-purpura",
    "tokenImageUrl": "/assets/2d/Monstros/Verme Purpura.png",
    "tokenType": "billboard"
  },
  {
    "name": "Vingador",
    "type": "Monstruosidade",
    "size": "Médio",
    "alignment": "Neutro",
    "ac": 12,
    "hp": 30,
    "speed": "9m (30ft)",
    "cr": "1",
    "xp": 200,
    "str": 12,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Pancada",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão."
      }
    ],
    "id": "vingador",
    "tokenImageUrl": "/assets/2d/Monstros/Vingador.png",
    "tokenType": "billboard"
  },
  {
    "name": "Wyvern",
    "type": "Dragão",
    "size": "Grande",
    "alignment": "Sem Alinhamento",
    "ac": 13,
    "hp": 110,
    "speed": "6 m, fly: 24 m",
    "cr": "6",
    "xp": 2300,
    "str": 19,
    "dex": 10,
    "con": 16,
    "int": 5,
    "wis": 12,
    "cha": 6,
    "abilities": [],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "desc": "The wyvern makes two attacks: one with its bite and one with its stinger. While flying, it can use its claws in place of one other attack."
      },
      {
        "name": "Bite",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 10 metros, one creature. Hit: 11 (2d6 + 4) dano perfurante."
      },
      {
        "name": "Claws",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 5 metros, um alvo. Hit: 13 (2d8 + 4) dano cortante."
      },
      {
        "name": "Stinger",
        "desc": "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 10 metros, one creature. Hit: 11 (2d6 + 4) dano perfurante. The target must make a CD 15 Constitution teste de resistência, taking 24 (7d6) dano de veneno on a failed save, or half as much damage on a successful one."
      }
    ],
    "id": "wyvern",
    "tokenImageUrl": "/assets/2d/Monstros/Wyvern.png",
    "tokenType": "billboard"
  },
  {
    "name": "Zumbi",
    "type": "Morto-Vivo",
    "size": "Médio",
    "alignment": "Neutro e Mau",
    "ac": 8,
    "hp": 22,
    "speed": "6 m",
    "cr": "0.25",
    "xp": 50,
    "str": 13,
    "dex": 6,
    "con": 16,
    "int": 3,
    "wis": 6,
    "cha": 5,
    "abilities": [
      {
        "name": "Undead Fortitude",
        "desc": "If damage reduces the zombie to 0 hit points, it must make a Constitution teste de resistência with a CD of 5+the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Slam",
        "desc": "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 5 metros, um alvo. Hit: 4 (1d6 + 1) dano de concussão."
      }
    ],
    "id": "zumbi",
    "tokenImageUrl": "/assets/2d/Monstros/Zumbi.png",
    "tokenType": "billboard"
  }
];

export const INITIAL_SPELLS: SRDSpell[] = [
  {
    id: 'magic-missile',
    name: 'Mísseis Mágicos (Magic Missile)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: '36 metros',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Você cria três dardos brilhantes de força mágica. Cada dardo atinge uma criatura à sua escolha e causa 1d4 + 1 de dano de força automaticamente (sem teste de ataque).',
    classes: ['Mago', 'Feiticeiro']
  },
  {
    id: 'fireball',
    name: 'Bola de Fogo (Fireball)',
    level: 3,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: '45 metros (150 pés)',
    components: 'V, S, M (uma bolinha de guano de morcego e enxofre)',
    duration: 'Instantânea',
    description: 'Um raio brilhante lampeja do seu dedo indicador para um ponto que você escolher e explode com um rugido baixo em uma explosão de chamas. Cada criatura em uma esfera de 6m de raio deve fazer um teste de Destreza. Falha: 8d6 de dano de fogo.',
    classes: ['Mago', 'Feiticeiro']
  },
  {
    id: 'cure-wounds',
    name: 'Curar Ferimentos (Cure Wounds)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: 'Toque',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Uma criatura que você tocar recupera um número de pontos de vida igual a 1d8 + seu modificador de habilidade de conjuração.',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladino', 'Ranger']
  },
  {
    id: 'shield',
    name: 'Escudo Mágico (Shield)',
    level: 1,
    school: 'Abjuração',
    castingTime: '1 Reação',
    range: 'Pessoal',
    components: 'V, S',
    duration: '1 Rodada',
    description: 'Uma barreira invisível de força mágica surge e o protege. Até o início do seu próximo turno, você ganha +5 de bônus na CA.',
    classes: ['Mago', 'Feiticeiro']
  },
  {
    id: 'misty-step',
    name: 'Passo Nebuloso (Misty Step)',
    level: 2,
    school: 'Conjuração',
    castingTime: '1 Ação Bônus',
    range: 'Pessoal',
    components: 'V',
    duration: 'Instantânea',
    description: 'Brevemente cercado por uma névoa prateada, você se teleporta até 9 metros para um espaço desocupado que possa ver.',
    classes: ['Mago', 'Feiticeiro', 'Bruxo']
  },
  {
    id: 'hold-person',
    name: 'Imobilizar Pessoa (Hold Person)',
    level: 2,
    school: 'Encantamento',
    castingTime: '1 Ação',
    range: '18 metros',
    components: 'V, S, M (uma pequena peça de ferro reto)',
    duration: 'Concentração, até 1 minuto',
    description: 'Escolha um humanoide. Ele deve passar num teste de resistência de Sabedoria ou ficará Paralisado pela duração da magia.',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Mago', 'Feiticeiro', 'Bruxo']
  },
  {
    id: 'invisibility',
    name: 'Invisibilidade (Invisibility)',
    level: 2,
    school: 'Ilusão',
    castingTime: '1 Ação',
    range: 'Toque',
    components: 'V, S, M (uma pestana envolta em goma)',
    duration: 'Concentração, até 1 hora',
    description: 'Uma criatura que você tocar fica invisível até que a magia termine. A magia termina se o alvo atacar ou conjurar uma magia.',
    classes: ['Bardo', 'Mago', 'Feiticeiro', 'Bruxo']
  },
  {
    id: 'eldritch-blast',
    name: 'Disparo Místico (Eldritch Blast)',
    level: 0,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: '36 metros',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Um feixe de energia crepitante dispara em direção a uma criatura ao alcance. Faça um ataque à distância com magia. Acerto: 1d10 de dano de força.',
    classes: ['Bruxo']
  }
];

export const INITIAL_ITEMS: SRDItem[] = [
  {
    id: 'bag-of-holding',
    name: 'Mochila de Carga (Bag of Holding)',
    type: 'Item Mágico (Maravilhoso)',
    rarity: 'Incomum',
    description: 'Esta mochila tem um espaço interior consideravelmente maior que suas dimensões externas. Ela pode conter até 250 kg.'
  },
  {
    id: 'flame-tongue',
    name: 'Língua de Fogo (Flame Tongue)',
    type: 'Arma Mágica (Espada)',
    rarity: 'Rara',
    description: 'Você pode usar uma ação bônus para falar a palavra de comando, fazendo com que chamas brotem da lâmina. Causa 2d6 de dano de fogo adicional.'
  },
  {
    id: 'potion-of-healing',
    name: 'Poção de Cura',
    type: 'Consumível',
    rarity: 'Comum',
    description: 'Você recupera 2d4 + 2 pontos de vida ao beber esta poção vermelha borbulhante.',
    value: '50 PO'
  },
  {
    id: 'ring-of-protection',
    name: 'Anel de Proteção',
    type: 'Anel Mágico',
    rarity: 'Raro',
    description: 'Você ganha +1 de bônus na Classe de Armadura e nos testes de resistência enquanto usar este anel.'
  },
  {
    id: 'wand-of-magic-missiles',
    name: 'Varinha de Mísseis Mágicos',
    type: 'Varinha Mágica',
    rarity: 'Incomum',
    description: 'Esta varinha tem 7 cargas. Enquanto a segurar, você pode usar uma ação para gastar 1 ou mais cargas para conjurar Mísseis Mágicos.'
  },
  {
    id: 'cloak-of-displacement',
    name: 'Capa do Deslocamento',
    type: 'Item Mágico (Vestuário)',
    rarity: 'Rara',
    description: 'Enquanto usar esta capa, ela projeta uma ilusão de você ao seu lado, fazendo com que ataques contra você tenham Desvantagem.'
  }
];

export const INITIAL_ENCOUNTERS: Encounter[] = [
  {
    id: 'emboscada-floresta',
    name: 'Emboscada na Estrada da Floresta',
    description: 'Bando de goblins atacando a carroça dos aventureiros na curva da estrada.',
    combatants: [
      { name: 'Goblin Espião #1', type: 'monster', hp: 7, maxHp: 7, ac: 15, conditions: [], cr: '1/4' },
      { name: 'Goblin Arqueiro #2', type: 'monster', hp: 7, maxHp: 7, ac: 15, conditions: [], cr: '1/4' },
      { name: 'Goblin Arqueiro #3', type: 'monster', hp: 7, maxHp: 7, ac: 15, conditions: [], cr: '1/4' },
      { name: 'Líder Hobgoblin Kraag', type: 'monster', hp: 11, maxHp: 11, ac: 18, conditions: [], cr: '1/2' }
    ]
  },
  {
    id: 'tumba-dos-esqueletos',
    name: 'Guardiões da Tumba Sombria',
    description: 'Esqueletos antigos despertando assim que o sarcófago é aberto.',
    combatants: [
      { name: 'Esqueleto Guerreiro #1', type: 'monster', hp: 13, maxHp: 13, ac: 13, conditions: [], cr: '1/4' },
      { name: 'Esqueleto Arqueiro #2', type: 'monster', hp: 13, maxHp: 13, ac: 13, conditions: [], cr: '1/4' },
      { name: 'Esqueleto Arqueiro #3', type: 'monster', hp: 13, maxHp: 13, ac: 13, conditions: [], cr: '1/4' }
    ]
  }
];

export const INITIAL_LORE_NODES: LoreNode[] = [
  {
    id: 'valiria',
    name: 'Cidade Real de Valíria',
    type: 'location',
    status: 'active',
    description: 'Capital majestosa cercada por muralhas brancas de mármore e torres de conjuração.',
    connectedTo: [
      { targetId: 'rei-aris', type: 'neutral' },
      { targetId: 'guilda-sombras', type: 'neutral' }
    ]
  },
  {
    id: 'rei-aris',
    name: 'Rei Aris III',
    type: 'npc',
    status: 'alive',
    description: 'Monarca idoso e precavido que tenta manter a paz na região a qualquer custo.',
    connectedTo: [
      { targetId: 'valiria', type: 'neutral' }
    ]
  },
  {
    id: 'guilda-sombras',
    name: 'Guilda das Sombras',
    type: 'faction',
    status: 'hostile',
    description: 'Sindicato de ladrões e assassinos operando nos subterrâneos da cidade.',
    connectedTo: [
      { targetId: 'valiria', type: 'neutral' },
      { targetId: 'kraag-npc', type: 'neutral' }
    ]
  },
  {
    id: 'kraag-npc',
    name: 'Kraag, o Devastador',
    type: 'npc',
    status: 'alive',
    description: 'Chefe hobgoblin mercenário contratado secretamente pela Guilda das Sombras.',
    connectedTo: [
      { targetId: 'guilda-sombras', type: 'neutral' }
    ]
  }
];

export const BGM_TRACKS: BGMTrack[] = [
  // Taverna & Social
  { id: 'bgm-taverna', name: 'Taverna Rústica', category: 'taverna', url: '/audio/bgm/Taverna.mp3', isLoop: true },
  { id: 'bgm-taverna-2', name: 'Taverna Festiva', category: 'taverna', url: '/audio/bgm/Taverna 2.mp3', isLoop: true },
  { id: 'bgm-mercado', name: 'Mercado & Comércio', category: 'taverna', url: '/audio/bgm/Mercado.mp3', isLoop: true },

  // Exploração & Ambientação
  { id: 'bgm-cidade', name: 'Cidade Vibrante', category: 'exploracao', url: '/audio/bgm/Cidade.mp3', isLoop: true },
  { id: 'bgm-cidade-deserto', name: 'Cidade do Deserto', category: 'exploracao', url: '/audio/bgm/Cidade do Deserto.mp3', isLoop: true },
  { id: 'bgm-deserto', name: 'Deserto de Areias Quentes', category: 'exploracao', url: '/audio/bgm/Deserto.mp3', isLoop: true },
  { id: 'bgm-castelo', name: 'Castelo Real & Realeza', category: 'exploracao', url: '/audio/bgm/Castelo.mp3', isLoop: true },
  { id: 'bgm-sala-trono', name: 'Sala do Trono', category: 'exploracao', url: '/audio/bgm/Sala do Trono.mp3', isLoop: true },

  // Masmorra & Tensão
  { id: 'bgm-catacumbas', name: 'Catacumbas Sombrias', category: 'masmorra', url: '/audio/bgm/Catacumbas.mp3', isLoop: true },
  { id: 'bgm-cemiterio', name: 'Cemitério Assombrado', category: 'tensao', url: '/audio/bgm/Cemitério.mp3', isLoop: true },

  // Combate (4 trilhas de batalha)
  { id: 'bgm-batalha-1', name: 'Batalha Épica I', category: 'combate', url: '/audio/bgm/Batalha 1.mp3', isLoop: true },
  { id: 'bgm-batalha-2', name: 'Batalha Épica II', category: 'combate', url: '/audio/bgm/Batalha 2.mp3', isLoop: true },
  { id: 'bgm-batalha-3', name: 'Batalha Épica III', category: 'combate', url: '/audio/bgm/Batalha 3.mp3', isLoop: true },
  { id: 'bgm-batalha-4', name: 'Batalha Épica IV', category: 'combate', url: '/audio/bgm/Batalha 4.mp3', isLoop: true }
];

export const SFX_BUTTONS: SFXButton[] = [
  // ── Combate Corpo-a-Corpo ──
  { id: 'sfx-sword-slash', name: 'Golpe de Espada', iconName: 'Sword', category: 'combat', url: '/audio/sfx/sword-slash.mp3' },
  { id: 'sfx-attack-1', name: 'Ataque Corpo-a-Corpo I', iconName: 'Swords', category: 'combat', url: '/audio/sfx/attack-1.mp3' },
  { id: 'sfx-attack-2', name: 'Ataque Corpo-a-Corpo II', iconName: 'Swords', category: 'combat', url: '/audio/sfx/attack-2.mp3' },
  { id: 'sfx-attack-3', name: 'Ataque Corpo-a-Corpo III', iconName: 'Hammer', category: 'combat', url: '/audio/sfx/attack-3.mp3' },

  // ── Combate à Distância ──
  { id: 'sfx-arrow-shot', name: 'Tiro de Flecha', iconName: 'Target', category: 'combat', url: '/audio/sfx/arrow-shot.mp3' },
  { id: 'sfx-bow-loading', name: 'Carregando Arco', iconName: 'Target', category: 'combat', url: '/audio/sfx/bow-loading.mp3' },

  // ── Combate Especial ──
  { id: 'sfx-ambush', name: 'Emboscada!', iconName: 'ShieldAlert', category: 'combat', url: '/audio/sfx/ambush.mp3' },
  { id: 'sfx-leopard-attack', name: 'Ataque de Leopardo', iconName: 'Footprints', category: 'combat', url: '/audio/sfx/leopard-attack.mp3' },
  { id: 'sfx-tiger-attack', name: 'Ataque de Tigre', iconName: 'Footprints', category: 'combat', url: '/audio/sfx/tiger-attack.mp3' },

  // ── Magias de Fogo ──
  { id: 'sfx-fireball', name: 'Bola de Fogo (Fireball)', iconName: 'Flame', category: 'magic', url: '/audio/sfx/fireball.mp3' },
  { id: 'sfx-fireball-explosion', name: 'Explosão de Bola de Fogo', iconName: 'Flame', category: 'magic', url: '/audio/sfx/bola-de-fogo-explosão.mp3' },
  { id: 'sfx-lanca-fogo', name: 'Lança de Fogo', iconName: 'Flame', category: 'magic', url: '/audio/sfx/lança-de-fogo.mp3' },
  { id: 'sfx-raio-fogo', name: 'Raio de Fogo', iconName: 'Zap', category: 'magic', url: '/audio/sfx/raio-de-fogo.mp3' },

  // ── Magias Arcanas & Divinas ──
  { id: 'sfx-magic-missile', name: 'Mísseis Mágicos', iconName: 'Sparkles', category: 'magic', url: '/audio/sfx/magic-missile.mp3' },
  { id: 'sfx-bless', name: 'Bênção (Bless)', iconName: 'Sparkles', category: 'magic', url: '/audio/sfx/bless.mp3' },
  { id: 'sfx-cure-wounds', name: 'Curar Ferimentos', iconName: 'Heart', category: 'magic', url: '/audio/sfx/cure-wounds.mp3' },
  { id: 'sfx-cure-wounds-2', name: 'Curar Ferimentos (Alt)', iconName: 'Heart', category: 'magic', url: '/audio/sfx/cure-wounds 2.mp3' },
  { id: 'sfx-mage-hand', name: 'Mão Arcana', iconName: 'Hand', category: 'magic', url: '/audio/sfx/mage-hand.mp3' },
  { id: 'sfx-teleport', name: 'Teletransporte', iconName: 'Zap', category: 'magic', url: '/audio/sfx/teleport.mp3' },
  { id: 'sfx-invisibility', name: 'Invisibilidade', iconName: 'EyeOff', category: 'magic', url: '/audio/sfx/invisibility.mp3' },
  { id: 'sfx-aparecer-magico', name: 'Aparição Mágica', iconName: 'Sparkles', category: 'magic', url: '/audio/sfx/aparecer-magico.mp3' },

  // ── Monstros & Criaturas ──
  { id: 'sfx-monster-roar', name: 'Rugido de Monstro', iconName: 'Skull', category: 'combat', url: '/audio/sfx/monster-roar.mp3' },
  { id: 'sfx-monster-roar-2', name: 'Rugido de Monstro II', iconName: 'Skull', category: 'combat', url: '/audio/sfx/monster-roar-2.mp3' },
  { id: 'sfx-colossal-roar', name: 'Rugido Colossal', iconName: 'Skull', category: 'combat', url: '/audio/sfx/colossal-monster-roar.mp3' },
  { id: 'sfx-monster-dying', name: 'Monstro Morrendo', iconName: 'Skull', category: 'combat', url: '/audio/sfx/monster-dying.mp3' },
  { id: 'sfx-urro-demonio', name: 'Urro do Demônio', iconName: 'Skull', category: 'combat', url: '/audio/sfx/urro-do-demonio.mp3' },
  { id: 'sfx-bees', name: 'Enxame de Abelhas', iconName: 'Wind', category: 'environment', url: '/audio/sfx/bees.mp3' },

  // ── Ambiente & Narrativa ──
  { id: 'sfx-coin', name: 'Moedas', iconName: 'Coins', category: 'environment', url: '/audio/sfx/coin.mp3' },
  { id: 'sfx-sinos', name: 'Sinos', iconName: 'Sun', category: 'environment', url: '/audio/sfx/Sinos.mp3' },
  { id: 'sfx-acampamento', name: 'Acampamento', iconName: 'Flame', category: 'environment', url: '/audio/sfx/acampamento.mp3' },
  { id: 'sfx-level-up', name: 'Level Up!', iconName: 'Zap', category: 'environment', url: '/audio/sfx/level-up.mp3' }
];

