import prismaClient from '../../../prismaClient'
import { autoEnd, endgameToPoints, Metric, metricToEvent } from "../analysisConstants";
import { EventAction, Position } from "@prisma/client";

/**
 * Averages a single scout report across multiple metrics.
 *
 * @param scoutReportUuid scout report to aggregate
 * @param metrics metrics to look at
 * @returns object of metric => average on given scout report
 */
export const averageScoutReport = async (scoutReportUuid: string, metrics: Metric[]): Promise<Partial<Record<Metric, number>>> => {
    try {

        const report = await prismaClient.scoutReport.findUniqueOrThrow({
            where: {
                uuid: scoutReportUuid
            },
            select: {
                bargeResult: true,
                driverAbility: true,
                events: {
                    select: {
                        action: true,
                        position: true,
                        points: true,
                        time: true
                    }
                }
            }
        });

        const result: Partial<Record<Metric, number>> = {};

        for (const metric of metrics) {
            switch (metric) {
                case Metric.driverAbility:
                    result[metric] = report.driverAbility;
                    break;
                case Metric.bargePoints:
                    result[metric] = endgameToPoints[report.bargeResult];
                    break;
                case Metric.autonLeaves:
                    // 1 if moved in auton, 0 if failed
                    result[metric] = report.events.some(e => e.action === EventAction.AUTO_LEAVE) ? 1 : 0;
                    break;
                case Metric.totalPoints:
                    // Endgame points + point sum
                    result[metric] = endgameToPoints[report.bargeResult] + report.events.reduce((acc, cur) => acc + cur.points, 0);
                    break;
                case Metric.teleopPoints:
                    // Point sum after auto
                    result[metric] = report.events.filter(e => e.time > autoEnd).reduce((acc, cur) => acc + cur.points, 0);
                case Metric.autoPoints:
                    // Point sum during auto
                    result[metric] = report.events.filter(e => e.time <= autoEnd).reduce((acc, cur) => acc + cur.points, 0);
                default:
                    // Generic event count
                    const action = metricToEvent[metric];
                    let position: Position = Position.NONE;
                    switch (metric) {
                        case Metric.coralL1:
                            position = Position.LEVEL_ONE;
                            break;
                        case Metric.coralL2:
                            position = Position.LEVEL_TWO;
                            break;
                        case Metric.coralL3:
                            position = Position.LEVEL_THREE;
                            break;
                        case Metric.coralL4:
                            position = Position.LEVEL_FOUR;
                            break;
                    }
                    result[metric] = report.events.filter(e => e.action === action && e.position === position).length;
                    break;
            }
        }

        return result;
    }
    catch (error) {
        console.error(error.error)
        throw (error)
    }
};