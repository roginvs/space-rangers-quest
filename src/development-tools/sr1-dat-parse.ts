import { PQImages } from "../lib/pqImages";
import * as fs from "fs";

const questRawNames = `
0=cfg\\Rus\\PlanetQuest\\Bank.qm
1=cfg\\Rus\\PlanetQuest\\Boat.qm
10=cfg\\Rus\\PlanetQuest\\Penetrator.qm
11=cfg\\Rus\\PlanetQuest\\Poroda.qm
12=cfg\\Rus\\PlanetQuest\\Rush.qm
13=cfg\\Rus\\PlanetQuest\\Spy.qm
14=cfg\\Rus\\PlanetQuest\\Tomb.qm
15=cfg\\Rus\\PlanetQuest\\Gladiator.qm
16=cfg\\Rus\\PlanetQuest\\Hachball.qm
17=cfg\\Rus\\PlanetQuest\\Energy.qm
18=cfg\\Rus\\PlanetQuest\\Gobsaur.qm
19=cfg\\Rus\\PlanetQuest\\Menzols.qm
2=cfg\\Rus\\PlanetQuest\\Newflora.qm
20=cfg\\Rus\\PlanetQuest\\Siege.qm
21=cfg\\Rus\\PlanetQuest\\Casino.qm
22=cfg\\Rus\\PlanetQuest\\Bondiana.qm
23=cfg\\Rus\\PlanetQuest\\Build.qm
24=cfg\\Rus\\PlanetQuest\\Diamond.qm
3=cfg\\Rus\\PlanetQuest\\Commando.qm
4=cfg\\Rus\\PlanetQuest\\Diehard.qm
5=cfg\\Rus\\PlanetQuest\\Examen.qm
6=cfg\\Rus\\PlanetQuest\\Fishing.qm
7=cfg\\Rus\\PlanetQuest\\Galaxy.qm
8=cfg\\Rus\\PlanetQuest\\Ikebana.qm
9=cfg\\Rus\\PlanetQuest\\Murder.qm
Prison=cfg\\Rus\\PlanetQuest\\Prison.qm
`;
const questRawPQI = `
0,L,1,68,70,72,75,80,81,82=Bm.PQI.Newflora_01
0,L,101=Bm.PQI.Bank_02
0,L,15,17,18=Bm.PQI.Examen_01
0,L,19=Bm.PQI.Hachball_04
0,L,20=Bm.PQI.Bank_01
0,L,32=Bm.PQI.Newflora_05
0,L,33=Bm.PQI.Newflora_02
0,L,34,39=Bm.PQI.Diehard_00
0,L,35,36,37,38=Bm.PQI.Bank_05
0,L,4,61,66,67=Bm.PQI.Bank_00
0,L,40,57,58,59=Bm.PQI.Hachball_00
0,L,41=Bm.PQI.Bank_08
0,L,46=Bm.PQI.Newflora_06
0,L,47,50,51=Bm.PQI.Bank_07
0,L,54,76,78,79,85,86,87,88=Bm.PQI.Bank_04
0,L,55,90,91,92,93,94,95,96,97,98,100=Bm.PQI.Bank_06
0,L,65=Bm.PQI.Bank_09
0,L,89=Bm.PQI.Hachball_03
0,L,99=Bm.PQI.Commando_03
0,P,162,163,164=Bm.PQI.Bank_08
0,P,240,241,242,243,279,280,282,283,305,306,307=Bm.PQI.Bank_05
0,P,35,224,308=Bm.PQI.Hachball_00
0,P,40,41=Bm.PQI.Tomb_03
0,P,42,43=Bm.PQI.Galaxy_01
0,P,45,90=Bm.PQI.Fishing_04
0,P,49,89,234,244=Bm.PQI.Hachball_03
0,P,54,91,232,248,255,257,258,260,285,289=Bm.PQI.Bank_03
0,P,92,93,231,245,286,290,293,296,299,303=Bm.PQI.Poroda_00
0,P,94,95,153,154,233,246,287,291,294,297,300,302=Bm.PQI.Bank_02
0,P,96,97,238,249,251,252,253,254,284,288=Bm.PQI.Ikebana_02
0,PAR,5=Bm.PQI.Penetrator_03
1,L,1,2=Bm.PQI.Boat_00
1,L,3=Bm.PQI.Boat_02
1,L,5,6,14=Bm.PQI.Boat_01
1,P,14,16,17,18,19,20,21,22,23,24,25=Bm.PQI.Boat_02
1,P,26,27,28,29=Bm.PQI.Boat_03
1,PAR,1=Bm.PQI.Boat_00
1,PAR,2=Bm.PQI.Boat_00
10,L,1,3,5=Bm.PQI.Hachball_04
10,L,1,6,12,15,48,51,52,53,57=Bm.PQI.Gladiator_00
10,L,13,28,34,36=Bm.PQI.Penetrator_03
10,L,14,40=Bm.PQI.Penetrator_05
10,L,16,22,23,24,25,26,35,39,41,42,44,46,47,64,65=Bm.PQI.Penetrator_04
10,L,2=Bm.PQI.Penetrator_00
10,L,27=Bm.PQI.Penetrator_02
10,L,4=Bm.PQI.Bank_08
10,L,7,8,9,10,11,29,30,32,37,38,43,45,48,49,50,51,52,53,54,55,56,57,58=Bm.PQI.Penetrator_01
10,P,11,12,14,15,16,19,20,27,41,43,44,50,57,58,59,60,62,64,76,85,89,91,93,95,126=Bm.PQI.Penetrator_04
10,P,13,28,29,30,34,55,61,87=Bm.PQI.Penetrator_01
10,P,69=Bm.PQI.Penetrator_02
10,PAR,1,4=Bm.PQI.Gladiator_00
10,PAR,6=Bm.PQI.Penetrator_05
11,L,1,3,25=Bm.PQI.Gladiator_00
11,L,14=Bm.PQI.Poroda_05
11,L,15=Bm.PQI.Poroda_02
11,L,16=Bm.PQI.Poroda_03
11,L,17=Bm.PQI.Poroda_04
11,L,18=Bm.PQI.Poroda_01
11,L,2=Bm.PQI.Siege_03
11,L,4,13,32,33,34,35,36,37,38,39,40,41=Bm.PQI.Poroda_00
11,L,5,7,8,9,10,11,12=Bm.PQI.Bank_09
11,PAR,2,3,4,5,6,7=Bm.PQI.Poroda_00
12,L,19,25,31,32,33,34=Bm.PQI.Rush_01
12,L,20=Bm.PQI.Rush_04
12,L,29=Bm.PQI.Rush_00
12,L,4=Bm.PQI.Rush_03
12,P,64,65,66,93=Bm.PQI.Rush_03
12,P,97=Bm.PQI.Rush_02
13,L,1,39=Bm.PQI.Galaxy_02
13,L,10=Bm.PQI.Galaxy_01
13,L,12,54,56,72,73,74,80,81,92=Bm.PQI.Spy_00
13,L,13=Bm.PQI.Tomb_01
13,L,14=Bm.PQI.Ikebana_01
13,L,15=Bm.PQI.Casino_00
13,L,17=Bm.PQI.Rush_02
13,L,18=Bm.PQI.Bank_07
13,L,2=Bm.PQI.Examen_01
13,L,20=Bm.PQI.Prison_07
13,L,21=Bm.PQI.Murder_02
13,L,25=Bm.PQI.Murder_01
13,L,26=Bm.PQI.Boat_01
13,L,3,7,16,19,22,23,29,57,70=Bm.PQI.Spy_01
13,L,30,61=Bm.PQI.Ikebana_02
13,L,32=Bm.PQI.Prison_05
13,L,34=Bm.PQI.Newflora_03
13,L,36=Bm.PQI.Tomb_03
13,L,4,40=Bm.PQI.Prison_02
13,L,42=Bm.PQI.Prison_06
13,L,43=Bm.PQI.Penetrator_02
13,L,44=Bm.PQI.Galaxy_00
13,L,45=Bm.PQI.Casino_04
13,L,46=Bm.PQI.Examen_00
13,L,49=Bm.PQI.Spy_02
13,L,5,27,28,31,47,50=Bm.PQI.Hachball_04
13,L,51,90=Bm.PQI.Energy_00
13,L,52,86=Bm.PQI.Bank_09
13,L,59=Bm.PQI.Diehard_00
13,L,6=Bm.PQI.Prison_08
13,L,60=Bm.PQI.Examen_03
13,L,62,63,67,68=Bm.PQI.Rush_01
13,L,64,79=Bm.PQI.Murder_05
13,L,65=Bm.PQI.Murder_04
13,L,8,24,33,35,37,38,41,77=Bm.PQI.Newflora_06
13,L,83,84,91=Bm.PQI.Prison_04
13,L,9=Bm.PQI.Newflora_04
13,P,136=Bm.PQI.Galaxy_02
13,P,176=Bm.PQI.Ikebana_02
13,P,179,182,196,205,206,220,222=Bm.PQI.Spy_00
13,P,93=Bm.PQI.Galaxy_01
13,PAR,1,2,3,4,5,6,7,8,9=Bm.PQI.Spy_00
14,L,1,24=Bm.PQI.Menzols_01
14,L,14=Bm.PQI.Tomb_03
14,L,15,26=Bm.PQI.Tomb_02
14,L,17=Bm.PQI.Rush_00
14,P,2=Bm.PQI.Tomb_00
14,P,45=Bm.PQI.Siege_01
14,P,5,56=Bm.PQI.Tomb_01
15,L,56,62,73,89,92=Bm.PQI.Gladiator_00
15,L,57=Bm.PQI.Bank_05
15,L,58,70,72,74,83,93,94=Bm.PQI.Hachball_05
15,L,59=Bm.PQI.Gladiator_01
15,L,63,79=Bm.PQI.Gladiator_02
15,L,65=Bm.PQI.Penetrator_00
15,L,68=Bm.PQI.Gladiator_03
15,L,75,85=Bm.PQI.Diamond_00
15,L,77=Bm.PQI.Newflora_07
15,L,82=Bm.PQI.Casino_04
15,L,90=Bm.PQI.Bank_09
15,P,107,133=Bm.PQI.Diamond_00
15,P,134,154,159=Bm.PQI.Penetrator_00
15,P,158,134,154=Bm.PQI.Gladiator_00
15,PAR,1,2,3=Bm.PQI.Gladiator_00
16,L,1=Bm.PQI.Examen_06
16,L,11=Bm.PQI.Hachball_04
16,L,12,57,65=Bm.PQI.Hachball_02
16,L,16,17,18,19,20,21,22,23,24=Bm.PQI.Hachball_03
16,L,3,8,10,53,54,63,64=Bm.PQI.Hachball_00
16,L,56=Bm.PQI.Hachball_01
16,L,58,59=Bm.PQI.Hachball_05
16,PAR,5=Bm.PQI.Hachball_01
17,L,1,35,50,51,52=Bm.PQI.Spy_00
17,L,11,19,27,40=Bm.PQI.Energy_00
17,L,26,38=Bm.PQI.Newflora_06
17,L,9,34,39,53=Bm.PQI.Prison_02
17,P,113,114=Bm.PQI.Prison_02
17,P,188=Bm.PQI.Energy_00
17,PAR,10=Bm.PQI.Energy_01
18,L,1=Bm.PQI.Gobsaur_03
18,L,13=Bm.PQI.Casino_03
18,L,3,16=Bm.PQI.Gobsaur_00
18,L,5,6=Bm.PQI.Gobsaur_02
18,P,18,34,49,62=Bm.PQI.Gobsaur_02
18,P,27,36,50,56,58,59,60,83=Bm.PQI.Gobsaur_01
18,P,84,85=Bm.PQI.Gobsaur_03
18,PAR,4=Bm.PQI.Gobsaur_02
19,L,1,2,74,198,199,200=Bm.PQI.Menzols_01
19,L,105,168=Bm.PQI.Menzols_02
19,L,106,120,121,169=Bm.PQI.Menzols_04
19,L,117=Bm.PQI.Bank_03
19,L,136,174=Bm.PQI.Fishing_03
19,L,29,77,79,131,132=Bm.PQI.Menzols_00
19,L,30=Bm.PQI.Bank_03
19,L,31,100=Bm.PQI.Menzols_03
19,L,32,164,166,167,202,203=Bm.PQI.Menzols_05
19,L,43,170=Bm.PQI.Menzols_04
19,L,46=Bm.PQI.Menzols_02
19,L,5,107,175,197=Bm.PQI.Gobsaur_03
19,L,78,120,130,206=Bm.PQI.Bank_03
19,P,25,66,268,371=Bm.PQI.Bank_03
19,P,266,272=Bm.PQI.Menzols_04
19,P,267,270=Bm.PQI.Menzols_04
19,P,27,28,104,126,240=Bm.PQI.Menzols_06
19,P,410=Bm.PQI.Fishing_03
19,P,43,222,390,411,424,426,431,455,456,457,458,459,540,555=Bm.PQI.Menzols_00
19,P,79=Bm.PQI.Menzols_03
2,L,1=Bm.PQI.Newflora_00
2,L,11,18=Bm.PQI.Newflora_05
2,L,23,101=Bm.PQI.Newflora_06
2,L,29=Bm.PQI.Galaxy_01
2,L,37=Bm.PQI.Examen_04
2,L,38,48=Bm.PQI.Newflora_01
2,L,46,100=Bm.PQI.Newflora_07
2,L,56=Bm.PQI.Newflora_04
2,L,60=Bm.PQI.Newflora_03
2,L,61=Bm.PQI.Newflora_02
2,L,87=Bm.PQI.Casino_04
20,L,1,15,26=Bm.PQI.Siege_01
20,L,12,16=Bm.PQI.Siege_00
20,L,19=Bm.PQI.Siege_02
20,L,24=Bm.PQI.Diamond_00
20,L,36=Bm.PQI.Hachball_04
20,L,37=Bm.PQI.Siege_03
20,L,42,52=Bm.PQI.Commando_03
20,L,46,51=Bm.PQI.Gladiator_00
20,P,102,105,114,121=Bm.PQI.Penetrator_01
20,P,136,137=Bm.PQI.Siege_02
20,P,50,51,52=Bm.PQI.Tomb_02
20,P,56,57,59=Bm.PQI.Penetrator_03
20,P,62=Bm.PQI.Commando_02
20,P,80,89,95,123=Bm.PQI.Diamond_00
20,PAR,17=Bm.PQI.Energy_01
21,L,1,99,100=Bm.PQI.Newflora_01
21,L,2,3,75,76,77,97=Bm.PQI.Casino_00
21,L,28,86=Bm.PQI.Casino_01
21,L,35,87=Bm.PQI.Casino_02
21,L,44,88=Bm.PQI.Casino_03
21,L,54,89=Bm.PQI.Casino_04
21,L,62,90=Bm.PQI.Casino_05
21,P,2=Bm.PQI.Newflora_01
22,L,11=Bm.PQI.Murder_03
22,L,117,119=Bm.PQI.Galaxy_01
22,L,118=Bm.PQI.Newflora_05
22,L,16,60,69,77,80,112=Bm.PQI.Siege_02
22,L,18=Bm.PQI.Build_01
22,L,19,43=Bm.PQI.Boat_01
22,L,21,27,61,66,79=Bm.PQI.Gobsaur_00
22,L,22,75,78,81,82,83,102,109,110,114,115,116=Bm.PQI.Hachball_00
22,L,23,24=Bm.PQI.Galaxy_02
22,L,30,62=Bm.PQI.Gobsaur_01
22,L,31=Bm.PQI.Bank_06
22,L,35,58,59=Bm.PQI.Gobsaur_02
22,L,36,70=Bm.PQI.Newflora_06
22,L,37=Bm.PQI.Newflora_02
22,L,38=Bm.PQI.Hachball_01
22,L,4,113=Bm.PQI.Prison_02
22,L,40,67=Bm.PQI.Bank_07
22,L,41,45,68=Bm.PQI.Murder_04
22,L,42=Bm.PQI.Newflora_07
22,L,48,71,72=Bm.PQI.Bondiana_00
22,L,53=Bm.PQI.Bank_09
22,L,55=Bm.PQI.Newflora_00
22,L,56,84=Bm.PQI.Diehard_03
22,P,143=Bm.PQI.Gobsaur_01
22,P,36=Bm.PQI.Prison_07
22,P,91,96,101,102,103,104,105,211,212,219=Bm.PQI.Siege_02
22,P,97,98,99,100=Bm.PQI.Galaxy_01
22,PAR,5,6=Bm.PQI.Gobsaur_02
23,L,1=Bm.PQI.Penetrator_01
23,L,16=Bm.PQI.Rush_00
23,L,2,3,4,5=Bm.PQI.Siege_03
23,L,36,40,42,44=Bm.PQI.Build_00
23,L,51,52,53,54=Bm.PQI.Prison_01
23,L,8,22,46=Bm.PQI.Build_01
23,L,9,17=Bm.PQI.Penetrator_00
23,P,134=Bm.PQI.Prison_01
23,P,16,18,34,35,52,53,69,70=Bm.PQI.Siege_02
23,P,17,36,54,71,131,133,135,138=Bm.PQI.Prison_01
23,P,19,20,33,37,51,55,68,72,76,191,192,193,194=Bm.PQI.Rush_00
23,P,2,77,136,137=Bm.PQI.Menzols_00
23,P,3=Bm.PQI.Build_02
23,P,4,130,195=Bm.PQI.Gobsaur_03
23,P,5,82,139=Bm.PQI.Fishing_04
23,P,78=Bm.PQI.Siege_02
23,PAR,2=Bm.PQI.Build_01
24,L,18=Bm.PQI.Menzols_06
24,L,20=Bm.PQI.Penetrator_00
24,L,21,23,25,27,57=Bm.PQI.Hachball_04
24,L,29=Bm.PQI.Siege_03
24,L,30=Bm.PQI.Boat_01
24,L,31,47=Bm.PQI.Bank_02
24,L,32,34=Bm.PQI.Newflora_06
24,L,33=Bm.PQI.Penetrator_03
24,L,35=Bm.PQI.Diamond_01
24,L,37,38,39,44,48=Bm.PQI.Diamond_00
24,L,40,42=Bm.PQI.Commando_04
24,L,41,45,49,52,53,54,55,59=Bm.PQI.Gladiator_00
24,L,43=Bm.PQI.Prison_02
24,L,46=Bm.PQI.Examen_02
24,L,50=Bm.PQI.Commando_02
24,L,51,63=Bm.PQI.Bank_06
24,P,175,301,302,303=Bm.PQI.Examen_04
24,P,188,211,225,227,231,241,243,259,261,279,281,345=Bm.PQI.Diamond_00
24,P,200,226,228,233,238,240,242,260,262,275,280,282,347=Bm.PQI.Bank_06
24,P,229,230,250,251,252,253,254=Bm.PQI.Diamond_01
24,P,235,270,331,336=Bm.PQI.Galaxy_01
24,P,239,244=Bm.PQI.Commando_01
24,P,255,256=Bm.PQI.Bank_02
24,P,258,263,277,278,283,284=Bm.PQI.Commando_02
24,P,267=Bm.PQI.Prison_10
24,P,271,272=Bm.PQI.Gladiator_03
24,P,346,352=Bm.PQI.Prison_01
24,PAR,9,10=Bm.PQI.Gladiator_00
3,L,11,26,27,31,33,34,35,43,49=Bm.PQI.Commando_00
3,L,22,40=Bm.PQI.Siege_02
3,L,29=Bm.PQI.Commando_01
3,L,38,47,51=Bm.PQI.Commando_02
3,L,39=Bm.PQI.Penetrator_03
3,L,46,49=Bm.PQI.Bank_00
3,P,106=Bm.PQI.Tomb_02
3,P,28=Bm.PQI.Siege_00
3,P,49,50,69,72,94,95,112=Bm.PQI.Commando_03
3,P,51,55,57,58,59,60,62,63,64,65,66,67,148,149,150,152,153,154=Bm.PQI.Commando_04
3,P,71,74,76,77,78=Bm.PQI.Commando_01
3,P,98,100,101=Bm.PQI.Penetrator_03
3,PAR,1,3=Bm.PQI.Commando_02
4,L,1=Bm.PQI.Energy_00
4,L,2,23,26=Bm.PQI.Diehard_01
4,L,20=Bm.PQI.Diehard_03
4,L,22=Bm.PQI.Diehard_02
4,L,28,30,34=Bm.PQI.Ikebana_00
4,L,31,41=Bm.PQI.Diehard_00
4,P,2,4,7,45=Bm.PQI.Diehard_01
4,P,53=Bm.PQI.Diehard_03
4,PAR,1,2,5=Bm.PQI.Ikebana_00
4,PAR,3=Bm.PQI.Diehard_03
5,L,1,7,14,17,18,37=Bm.PQI.Ikebana_00
5,L,10=Bm.PQI.Examen_02
5,L,11,23=Bm.PQI.Examen_04
5,L,13=Bm.PQI.Examen_01
5,L,20=Bm.PQI.Diamond_00
5,L,22=Bm.PQI.Examen_03
5,L,33=Bm.PQI.Examen_06
5,L,6,32,34,35=Bm.PQI.Examen_00
5,L,9,19=Bm.PQI.Examen_05
5,P,18=Bm.PQI.Examen_00
5,P,25=Bm.PQI.Examen_05
5,PAR,7=Bm.PQI.Ikebana_00
6,L,131,144,145,170=Bm.PQI.Hachball_00
6,L,143,156=Bm.PQI.Fishing_03
6,L,144,145,148,149,170=Bm.PQI.Fishing_04
6,L,147=Bm.PQI.Fishing_02
6,L,167=Bm.PQI.Fishing_05
6,L,172=Bm.PQI.Fishing_01
6,L,35,132,142,154=Bm.PQI.Fishing_00
6,P,340=Bm.PQI.Fishing_01
6,P,341=Bm.PQI.Fishing_02
6,P,375,376,378=Bm.PQI.Fishing_06
7,L,1,6,9=Bm.PQI.Galaxy_03
7,L,10,76,84=Bm.PQI.Newflora_01
7,L,11=Bm.PQI.Fishing_04
7,L,26=Bm.PQI.Murder_01
7,L,27=Bm.PQI.Prison_03
7,L,28=Bm.PQI.Murder_03
7,L,35,47,73=Bm.PQI.Murder_04
7,L,39,40=Bm.PQI.Galaxy_01
7,L,4=Bm.PQI.Newflora_06
7,L,5,56=Bm.PQI.Galaxy_00
7,L,58=Bm.PQI.Bank_08
7,L,59=Bm.PQI.Examen_03
7,L,60=Bm.PQI.Murder_05
7,L,61=Bm.PQI.Murder_02
7,L,62=Bm.PQI.Newflora_04
7,L,7,55=Bm.PQI.Examen_02
7,L,74=Bm.PQI.Galaxy_02
7,P,154,155=Bm.PQI.Bank_05
7,P,4=Bm.PQI.Bank_02
7,P,57,96=Bm.PQI.Prison_02
8,L,1,12=Bm.PQI.Ikebana_00
8,L,11=Bm.PQI.Ikebana_01
8,L,3,6,7,8,9,10=Bm.PQI.Examen_00
8,L,4,17=Bm.PQI.Ikebana_02
8,PAR,1=Bm.PQI.Ikebana_00
9,L,1,47=Bm.PQI.Murder_00
9,L,12,14=Bm.PQI.Hachball_04
9,L,16=Bm.PQI.Prison_00
9,L,19,37=Bm.PQI.Murder_05
9,L,2,9,10,11,13,15,57=Bm.PQI.Murder_01
9,L,20,23,59=Bm.PQI.Murder_04
9,L,21,44,56=Bm.PQI.Murder_03
9,L,36=Bm.PQI.Siege_01
9,L,8,17=Bm.PQI.Murder_02
9,P,37,38,39,40,41=Bm.PQI.Murder_02
Prison,L,1=Bm.PQI.Prison_00
Prison,L,110=Bm.PQI.Galaxy_02
Prison,L,111=Bm.PQI.Ikebana_01
Prison,L,113=Bm.PQI.Hachball_05
Prison,L,13,18,23,28,96=Bm.PQI.Prison_01
Prison,L,22=Bm.PQI.Prison_09
Prison,L,24,29,30=Bm.PQI.Prison_02
Prison,L,25,48,89=Bm.PQI.Prison_05
Prison,L,34=Bm.PQI.Prison_10
Prison,L,37,105=Bm.PQI.Siege_03
Prison,L,46=Bm.PQI.Prison_07
Prison,L,49=Bm.PQI.Prison_06
Prison,L,50=Bm.PQI.Prison_08
Prison,L,52=Bm.PQI.Prison_03
Prison,L,66=Bm.PQI.Bank_09
Prison,L,95=Bm.PQI.Hachball_01
Prison,L,98=Bm.PQI.Prison_04
Prison,P,106,353=Bm.PQI.Prison_02
Prison,P,340,341,342=Bm.PQI.Examen_02
Prison,P,39,117,123,144,174,188,220,264,333=Bm.PQI.Fishing_01
Prison,P,55=Bm.PQI.Galaxy_02
Prison,P,87,89=Bm.PQI.Bank_09
`;

const questIdToName: { [id: string]: string } = {};
questRawNames
  .split("\n")
  .filter((x) => x)
  .forEach((line) => {
    const id = line.split("=").shift();
    const name = line.split("\\").pop();
    if (!id || !name) {
      throw new Error();
    }
    questIdToName[id] = name;
  });

const imagesPerQuest: {
  [questId: string]: PQImages;
} = {};
questRawPQI
  .split("\n")
  .filter((x) => x)
  .forEach((line) => {
    // 16,L,16,17,18,19,20,21,22,23,24=Bm.PQI.Hachball_03
    const [left, right] = line.split("=");
    const [questId, type, ...ids] = left.split(",");

    const imageName = right.slice("Bm.PQI.".length);
    if (!right.startsWith("Bm.PQI.")) {
      throw new Error();
    }

    const questFileName =
      questIdToName[questId] !== "Prison.qm" ? questIdToName[questId] : "Prison1.qm";
    const questName = questFileName.slice(0, -3);
    if (!questFileName.endsWith(".qm")) {
      throw new Error();
    }

    if (!imagesPerQuest[questName]) {
      imagesPerQuest[questName] = [];
    }
    imagesPerQuest[questName].push({
      filename: imageName.toLowerCase() + ".jpg",
      ...(type === "L"
        ? {
            locationIds: ids.map((x) => parseInt(x)),
          }
        : undefined),
      ...(type === "P"
        ? {
            jumpIds: ids.map((x) => parseInt(x)),
          }
        : undefined),
      ...(type === "PAR"
        ? {
            critParams: ids.map((x) => parseInt(x)),
          }
        : undefined),
    });
  });

const jsonFileName = __dirname + "/../../src/sr1-pqi.json";
fs.writeFileSync(jsonFileName, JSON.stringify(imagesPerQuest, null, 4));
console.info(`Data is written into ${jsonFileName}`);
