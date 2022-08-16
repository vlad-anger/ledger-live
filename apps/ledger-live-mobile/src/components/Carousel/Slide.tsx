import React, { useCallback } from "react";
import { Linking, Image } from "react-native";
import { Flex, Text, Link as TextLink, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import Touchable from "../Touchable";
import { track } from "../../analytics";
import { SlideProps } from "./shared";
import { useCurrentRouteName } from "../../helpers/routeHooks";

const StyledTouchable = styled(Touchable)`
  flex: 1;
`;

export type SlideProps = {
  url: string;
  onPress?: (navigate: (...args: any) => void) => void;
  name: string;
  title: string;
  description: any;
  cta: any;
  image?: any;
  width?: number;
  icon?: any;
  position?: any;
};

const Slide = ({
  url,
  onPress,
  name,
  title,
  description,
  cta,
  image,
  icon,
  position,
  width,
}: SlideProps) => {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const currentScreen = useCurrentRouteName();
  const onClick = useCallback(() => {
    track("banner_clicked", {
      banner: "Discover Web3",
      url,
      screen: currentScreen,
    });
    if (onPress) {
      onPress(navigate);
    } else {
      Linking.openURL(url);
    }
  }, [onPress, navigate, url, currentScreen]);
  return (
    <StyledTouchable event={`${name} Carousel`} onPress={onClick}>
      <Flex
        width={width}
        flex={1}
        borderRadius={2}
        borderWidth={"1px"}
        borderColor={"neutral.c40"}
        justifyContent={"space-between"}
        flexDirection={"row"}
        p={6}
      >
        <Flex alignItems="flex-start" flex={1}>
          <Text variant={"subtitle"} fontSize={11} color={"neutral.c60"}>
            {t(title)}
          </Text>
          <Text variant="paragraph" fontSize={14}>
            {t(description)}
          </Text>
          <Flex flex={1} />
          {cta ? (
            <TextLink
              type="color"
              Icon={Icons.ArrowRightMedium}
              iconPosition="right"
              onPress={onClick}
            >
              {t(cta)}
            </TextLink>
          ) : null}
        </Flex>
        <Flex justifyContent={"center"}>
          {image ? (
            <Image
              style={[{ position: "absolute" }, position]}
              source={image}
            />
          ) : icon ? (
            <Flex>{icon}</Flex>
          ) : null}
        </Flex>
      </Flex>
    </StyledTouchable>
  );
};

export default Slide;
