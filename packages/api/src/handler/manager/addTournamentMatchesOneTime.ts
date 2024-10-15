
import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const addTournamentMatchesOneTime = async (req: Request, res: Response): Promise<void> => {
    try {
       const rows = await prismaClient.teamMatchData.createMany({
        data :
        [
            {
              "key": "2024tuhc_qm1_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 1,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm1_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 1,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm1_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 1,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm1_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 1,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm1_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 1,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm1_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 1,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm2_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 2,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm2_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 2,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm2_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 2,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm2_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 2,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm2_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 2,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm2_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 2,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm3_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 3,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm3_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 3,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm3_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 3,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm3_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 3,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm3_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 3,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm3_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 3,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm4_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 4,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm4_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 4,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm4_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 4,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm4_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 4,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm4_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 4,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm4_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 4,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm5_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 5,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm5_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 5,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm5_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 5,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm5_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 5,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm5_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 5,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm5_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 5,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm6_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 6,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm6_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 6,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm6_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 6,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm6_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 6,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm6_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 6,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm6_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 6,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm7_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 7,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm7_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 7,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm7_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 7,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm7_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 7,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm7_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 7,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm7_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 7,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm8_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 8,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm8_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 8,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm8_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 8,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm8_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 8,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm8_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 8,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm8_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 8,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm9_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 9,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm9_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 9,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm9_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 9,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm9_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 9,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm9_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 9,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm9_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 9,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm10_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 10,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm10_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 10,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm10_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 10,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm10_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 10,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm10_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 10,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm10_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 10,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm11_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 11,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm11_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 11,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm11_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 11,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm11_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 11,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm11_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 11,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm11_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 11,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm12_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 12,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm12_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 12,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm12_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 12,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm12_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 12,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm12_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 12,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm12_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 12,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm13_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 13,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm13_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 13,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm13_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 13,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm13_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 13,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm13_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 13,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm13_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 13,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm14_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 14,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm14_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 14,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm14_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 14,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm14_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 14,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm14_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 14,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm14_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 14,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm15_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 15,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm15_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 15,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm15_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 15,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm15_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 15,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm15_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 15,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm15_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 15,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm16_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 16,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm16_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 16,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm16_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 16,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm16_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 16,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm16_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 16,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm16_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 16,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm17_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 17,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm17_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 17,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm17_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 17,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm17_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 17,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm17_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 17,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm17_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 17,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm18_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 18,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm18_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 18,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm18_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 18,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm18_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 18,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm18_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 18,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm18_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 18,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm19_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 19,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm19_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 19,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm19_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 19,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm19_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 19,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm19_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 19,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm19_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 19,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm20_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 20,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm20_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 20,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm20_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 20,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm20_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 20,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm20_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 20,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm20_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 20,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm21_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 21,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm21_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 21,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm21_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 21,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm21_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 21,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm21_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 21,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm21_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 21,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm22_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 22,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm22_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 22,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm22_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 22,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm22_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 22,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm22_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 22,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm22_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 22,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm23_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 23,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm23_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 23,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm23_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 23,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm23_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 23,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm23_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 23,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm23_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 23,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm24_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 24,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm24_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 24,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm24_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 24,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm24_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 24,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm24_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 24,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm24_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 24,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm25_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 25,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm25_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 25,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm25_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 25,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm25_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 25,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm25_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 25,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm25_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 25,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm26_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 26,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm26_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 26,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm26_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 26,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm26_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 26,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm26_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 26,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm26_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 26,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm27_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 27,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm27_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 27,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm27_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 27,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm27_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 27,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm27_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 27,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm27_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 27,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm28_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 28,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm28_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 28,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm28_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 28,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm28_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 28,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm28_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 28,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm28_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 28,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm29_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 29,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm29_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 29,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm29_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 29,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm29_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 29,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm29_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 29,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm29_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 29,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm30_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 30,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm30_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 30,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm30_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 30,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm30_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 30,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm30_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 30,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm30_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 30,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm31_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 31,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm31_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 31,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm31_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 31,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm31_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 31,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm31_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 31,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm31_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 31,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm32_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 32,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm32_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 32,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm32_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 32,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm32_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 32,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm32_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 32,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm32_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 32,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm33_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 33,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm33_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 33,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm33_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 33,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm33_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 33,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm33_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 33,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm33_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 33,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm34_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 34,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm34_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 34,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm34_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 34,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm34_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 34,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm34_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 34,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm34_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 34,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm35_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 35,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm35_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 35,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm35_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 35,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm35_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 35,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm35_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 35,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm35_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 35,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm36_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 36,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm36_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 36,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm36_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 36,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm36_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 36,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm36_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 36,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm36_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 36,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm37_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 37,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm37_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 37,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm37_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 37,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm37_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 37,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm37_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 37,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm37_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 37,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm38_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 38,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm38_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 38,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm38_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 38,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm38_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 38,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm38_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 38,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm38_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 38,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm39_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 39,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm39_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 39,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm39_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 39,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm39_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 39,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm39_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 39,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm39_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 39,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm40_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 40,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm40_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 40,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm40_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 40,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm40_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 40,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm40_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 40,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm40_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 40,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm41_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 41,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm41_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 41,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm41_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 41,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm41_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 41,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm41_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 41,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm41_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 41,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm42_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 42,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm42_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 42,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm42_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 42,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm42_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 42,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm42_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 42,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm42_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 42,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm43_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 43,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm43_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 43,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm43_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 43,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm43_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 43,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm43_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 43,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm43_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 43,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm44_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 44,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm44_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 44,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm44_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 44,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm44_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 44,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm44_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 44,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm44_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 44,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm45_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 45,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm45_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 45,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm45_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 45,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm45_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 45,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm45_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 45,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm45_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 45,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm46_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 46,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm46_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 46,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm46_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 46,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm46_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 46,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm46_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 46,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm46_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 46,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm47_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 47,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm47_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 47,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm47_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 47,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm47_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 47,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm47_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 47,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm47_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 47,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm48_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 48,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm48_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 48,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm48_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 48,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm48_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 48,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm48_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 48,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm48_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 48,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm49_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 49,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm49_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 49,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm49_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 49,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm49_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 49,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm49_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 49,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm49_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 49,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm50_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 50,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm50_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 50,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm50_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 50,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm50_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 50,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm50_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 50,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm50_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 50,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm51_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 51,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm51_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 51,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm51_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 51,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm51_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 51,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm51_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 51,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm51_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 51,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm52_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 52,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm52_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 52,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm52_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 52,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm52_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 52,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm52_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 52,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm52_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 52,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm53_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 53,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm53_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 53,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm53_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 53,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm53_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 53,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm53_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 53,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm53_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 53,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm54_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 54,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm54_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 54,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm54_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 54,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm54_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 54,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm54_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 54,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm54_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 54,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm55_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 55,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm55_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 55,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm55_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 55,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm55_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 55,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm55_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 55,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm55_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 55,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm56_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 56,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm56_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 56,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm56_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 56,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm56_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 56,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm56_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 56,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm56_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 56,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm57_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 57,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm57_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 57,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm57_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 57,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm57_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 57,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm57_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 57,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm57_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 57,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm58_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 58,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm58_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 58,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm58_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 58,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm58_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 58,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm58_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 58,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm58_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 58,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm59_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 59,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm59_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 59,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm59_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 59,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm59_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 59,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm59_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 59,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm59_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 59,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm60_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 60,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm60_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 60,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm60_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 60,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm60_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 60,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm60_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 60,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm60_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 60,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm61_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 61,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm61_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 61,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm61_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 61,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm61_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 61,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm61_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 61,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm61_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 61,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm62_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 62,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm62_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 62,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm62_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 62,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm62_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 62,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm62_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 62,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm62_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 62,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm63_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 63,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm63_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 63,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm63_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 63,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm63_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 63,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm63_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 63,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm63_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 63,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm64_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 64,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm64_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 64,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm64_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 64,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm64_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 64,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm64_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 64,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm64_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 64,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm65_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 65,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm65_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 65,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm65_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 65,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm65_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 65,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm65_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 65,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm65_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 65,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm66_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 66,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm66_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 66,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm66_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 66,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm66_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 66,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm66_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 66,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm66_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 66,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm67_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 67,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm67_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 67,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm67_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 67,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm67_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 67,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm67_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 67,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm67_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 67,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm68_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 68,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm68_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 68,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm68_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 68,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm68_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 68,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm68_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 68,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm68_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 68,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm69_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 69,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm69_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 69,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm69_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 69,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm69_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 69,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm69_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 69,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm69_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 69,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm70_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 70,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm70_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 70,
              "teamNumber": 9447,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm70_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 70,
              "teamNumber": 2905,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm70_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 70,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm70_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 70,
              "teamNumber": 9436,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm70_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 70,
              "teamNumber": 6874,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm71_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 71,
              "teamNumber": 9502,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm71_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 71,
              "teamNumber": 9281,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm71_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 71,
              "teamNumber": 9025,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm71_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 71,
              "teamNumber": 6429,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm71_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 71,
              "teamNumber": 5883,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm71_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 71,
              "teamNumber": 8308,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm72_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 72,
              "teamNumber": 6430,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm72_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 72,
              "teamNumber": 9690,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm72_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 72,
              "teamNumber": 9490,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm72_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 72,
              "teamNumber": 9247,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm72_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 72,
              "teamNumber": 3646,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm72_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 72,
              "teamNumber": 7086,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm73_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 73,
              "teamNumber": 7050,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm73_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 73,
              "teamNumber": 6415,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm73_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 73,
              "teamNumber": 6838,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm73_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 73,
              "teamNumber": 9231,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm73_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 73,
              "teamNumber": 6024,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm73_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 73,
              "teamNumber": 8158,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm74_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 74,
              "teamNumber": 7672,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm74_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 74,
              "teamNumber": 8058,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm74_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 74,
              "teamNumber": 6417,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm74_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 74,
              "teamNumber": 8084,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm74_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 74,
              "teamNumber": 9469,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm74_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 74,
              "teamNumber": 9591,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm75_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 75,
              "teamNumber": 7035,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm75_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 75,
              "teamNumber": 6064,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm75_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 75,
              "teamNumber": 9583,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm75_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 75,
              "teamNumber": 8220,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm75_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 75,
              "teamNumber": 9468,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm75_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 75,
              "teamNumber": 9070,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm76_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 76,
              "teamNumber": 7522,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm76_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 76,
              "teamNumber": 8777,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm76_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 76,
              "teamNumber": 9609,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm76_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 76,
              "teamNumber": 8557,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm76_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 76,
              "teamNumber": 8159,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm76_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 76,
              "teamNumber": 9625,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm77_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 77,
              "teamNumber": 9464,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm77_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 77,
              "teamNumber": 8173,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm77_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 77,
              "teamNumber": 6985,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm77_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 77,
              "teamNumber": 7575,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm77_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 77,
              "teamNumber": 9692,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm77_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 77,
              "teamNumber": 7444,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm78_3",
              "tournamentKey": "2024tuhc",
              "matchNumber": 78,
              "teamNumber": 8042,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm78_4",
              "tournamentKey": "2024tuhc",
              "matchNumber": 78,
              "teamNumber": 8214,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm78_5",
              "tournamentKey": "2024tuhc",
              "matchNumber": 78,
              "teamNumber": 9523,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm78_0",
              "tournamentKey": "2024tuhc",
              "matchNumber": 78,
              "teamNumber": 9565,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm78_1",
              "tournamentKey": "2024tuhc",
              "matchNumber": 78,
              "teamNumber": 4191,
              "matchType": "QUALIFICATION"
            },
            {
              "key": "2024tuhc_qm78_2",
              "tournamentKey": "2024tuhc",
              "matchNumber": 78,
              "teamNumber": 8500,
              "matchType": "QUALIFICATION"
            }
          ]

       })
       res.status(200).send(rows)

    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};



