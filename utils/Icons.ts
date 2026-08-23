import { IconType } from "react-icons";
import { TbDog, TbCat, TbAlien, TbBallBowling, TbBombFilled, TbCarrot, TbCherryFilled, TbCactus, TbCloudRain, TbCoffee, TbCrown, TbDice1, TbDice2, TbDice3, TbDice4, TbDice5, TbDice6, TbFish, TbGhost, TbHeartFilled, TbIceCream, TbMeteor, TbOctagonFilled, TbPlane, TbPoo, TbSnowflake, } from 'react-icons/tb';

export const Icons: IconType[] = [TbDog, TbCat, TbAlien, TbBallBowling, TbBombFilled, TbCarrot, TbCherryFilled, TbCactus, TbCloudRain, TbCoffee, TbCrown, TbDice1, TbDice2, TbDice3, TbDice4, TbDice5, TbDice6, TbFish, TbGhost, TbHeartFilled, TbIceCream, TbMeteor, TbOctagonFilled, TbPlane, TbPoo, TbSnowflake,];

export const DEFAULT_ICON_NAME = "TbBallBowling";
export const DEFAULT_ICON_COLOR = "#000000";

export function getIconComponent(iconName: string | null | undefined): IconType | null {
  if (!iconName) return null;
  return Icons.find((icon) => icon.name === iconName) ?? null;
}
