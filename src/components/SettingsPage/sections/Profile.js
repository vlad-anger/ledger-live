// @flow

import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { remote } from 'electron'
import bcrypt from 'bcryptjs'

import { cleanAccountsCache } from 'actions/accounts'
import { unlock } from 'reducers/application' // FIXME should be in actions
import db, { setEncryptionKey } from 'helpers/db'
import { delay } from 'helpers/promise'
import hardReset from 'helpers/hardReset'

import type { SettingsState } from 'reducers/settings'
import type { T } from 'types/common'

import Track from 'analytics/Track'
import TrackPage from 'analytics/TrackPage'
import ExportLogsBtn from 'components/ExportLogsBtn'
import CheckBox from 'components/base/CheckBox'
import Box from 'components/base/Box'
import Button from 'components/base/Button'
import { ConfirmModal } from 'components/base/Modal'
import IconTriangleWarning from 'icons/TriangleWarning'
import IconUser from 'icons/User'
import PasswordModal from '../PasswordModal'
import DisablePasswordModal from '../DisablePasswordModal'

import {
  SettingsSection as Section,
  SettingsSectionHeader as Header,
  SettingsSectionBody as Body,
  SettingsSectionRow as Row,
} from '../SettingsSection'

const mapDispatchToProps = {
  unlock,
  cleanAccountsCache,
}

type Props = {
  t: T,
  settings: SettingsState,
  unlock: Function,
  saveSettings: Function,
  cleanAccountsCache: () => *,
}

type State = {
  isHardResetModalOpened: boolean,
  isSoftResetModalOpened: boolean,
  isPasswordModalOpened: boolean,
  isDisablePasswordModalOpened: boolean,
  isHardResetting: boolean,
}

class TabProfile extends PureComponent<Props, State> {
  state = {
    isHardResetModalOpened: false,
    isSoftResetModalOpened: false,
    isPasswordModalOpened: false,
    isDisablePasswordModalOpened: false,
    isHardResetting: false,
  }

  setPassword = password => {
    const { saveSettings, unlock } = this.props
    window.requestIdleCallback(() => {
      setEncryptionKey('accounts', password)
      const hash = password ? bcrypt.hashSync(password, 8) : undefined
      saveSettings({
        password: {
          isEnabled: hash !== undefined,
          value: hash,
        },
      })
      unlock()
    })
  }

  handleOpenSoftResetModal = () => this.setState({ isSoftResetModalOpened: true })
  handleCloseSoftResetModal = () => this.setState({ isSoftResetModalOpened: false })
  handleOpenHardResetModal = () => this.setState({ isHardResetModalOpened: true })
  handleCloseHardResetModal = () => this.setState({ isHardResetModalOpened: false })
  handleOpenPasswordModal = () => this.setState({ isPasswordModalOpened: true })
  handleClosePasswordModal = () => this.setState({ isPasswordModalOpened: false })
  handleDisablePassowrd = () => this.setState({ isDisablePasswordModalOpened: true })
  handleCloseDisablePasswordModal = () => this.setState({ isDisablePasswordModalOpened: false })

  handleSoftReset = async () => {
    this.props.cleanAccountsCache()
    await delay(500)
    db.cleanCache()
    remote.getCurrentWindow().webContents.reload()
  }

  handleHardReset = async () => {
    this.setState({ isHardResetting: true })
    try {
      await hardReset()
      remote.getCurrentWindow().webContents.reloadIgnoringCache()
    } catch (err) {
      this.setState({ isHardResetting: false })
    }
  }

  handleChangePasswordCheck = isChecked => {
    if (isChecked) {
      this.handleOpenPasswordModal()
    } else {
      this.handleDisablePassowrd()
    }
  }

  handleChangePassword = (password: ?string) => {
    if (password) {
      this.setPassword(password)
      this.handleClosePasswordModal()
    } else {
      this.setPassword(undefined)
      this.handleCloseDisablePasswordModal()
    }
  }

  handleDeveloperMode = developerMode => {
    this.props.saveSettings({
      developerMode,
    })
  }

  hardResetIconRender = () => (
    <IconWrapperCircle color="alertRed">
      <IconTriangleWarning width={23} height={21} />
    </IconWrapperCircle>
  )

  render() {
    const { t, settings, saveSettings } = this.props
    const {
      isSoftResetModalOpened,
      isHardResetModalOpened,
      isPasswordModalOpened,
      isDisablePasswordModalOpened,
      isHardResetting,
    } = this.state
    const isPasswordEnabled = settings.password.isEnabled === true
    return (
      <Section>
        <TrackPage category="Settings" name="Profile" />
        <Header
          icon={<IconUser size={16} />}
          title={t('app:settings.tabs.profile')}
          desc={t('app:settings.display.desc')}
        />
        <Body>
          <Row
            title={t('app:settings.profile.password')}
            desc={t('app:settings.profile.passwordDesc')}
          >
            <Track onUpdate event={isPasswordEnabled ? 'PasswordEnabled' : 'PasswordDisabled'} />
            <Box horizontal flow={2} align="center">
              {isPasswordEnabled && (
                <Button onClick={this.handleOpenPasswordModal}>
                  {t('app:settings.profile.changePassword')}
                </Button>
              )}
              <CheckBox isChecked={isPasswordEnabled} onChange={this.handleChangePasswordCheck} />
            </Box>
          </Row>
          <Row
            title={t('app:settings.profile.reportErrors')}
            desc={t('app:settings.profile.reportErrorsDesc')}
          >
            <Track onUpdate event={settings.sentryLogs ? 'SentryEnabled' : 'SentryDisabled'} />
            <CheckBox
              isChecked={settings.sentryLogs}
              onChange={sentryLogs => saveSettings({ sentryLogs })}
            />
          </Row>
          <Row
            title={t('app:settings.profile.analytics')}
            desc={t('app:settings.profile.analyticsDesc')}
          >
            <Track
              onUpdate
              event={settings.shareAnalytics ? 'AnalyticsEnabled' : 'AnalyticsDisabled'}
            />
            <CheckBox
              isChecked={settings.shareAnalytics}
              onChange={shareAnalytics => saveSettings({ shareAnalytics })}
            />
          </Row>
          <Row
            title={t('app:settings.profile.developerMode')}
            desc={t('app:settings.profile.developerModeDesc')}
          >
            <Track onUpdate event={settings.developerMode ? 'DevModeEnabled' : 'DevModeDisabled'} />
            <CheckBox
              isChecked={settings.developerMode}
              onChange={developerMode => saveSettings({ developerMode })}
            />
          </Row>
          <Row
            title={t('app:settings.profile.softResetTitle')}
            desc={t('app:settings.profile.softResetDesc')}
          >
            <Button primary onClick={this.handleOpenSoftResetModal} event="ClearCacheIntent">
              {t('app:settings.profile.softReset')}
            </Button>
          </Row>
          <Row title={t('app:settings.exportLogs.title')} desc={t('app:settings.exportLogs.desc')}>
            <ExportLogsBtn />
          </Row>
          <Row
            title={t('app:settings.profile.hardResetTitle')}
            desc={t('app:settings.profile.hardResetDesc')}
          >
            <Button danger onClick={this.handleOpenHardResetModal} event="HardResetIntent">
              {t('app:settings.profile.hardReset')}
            </Button>
          </Row>
        </Body>

        <ConfirmModal
          isDanger
          isOpened={isSoftResetModalOpened}
          onClose={this.handleCloseSoftResetModal}
          onReject={this.handleCloseSoftResetModal}
          onConfirm={this.handleSoftReset}
          title={t('app:settings.softResetModal.title')}
          subTitle={t('app:settings.softResetModal.subTitle')}
          desc={t('app:settings.softResetModal.desc')}
        />

        <ConfirmModal
          isDanger
          isLoading={isHardResetting}
          isOpened={isHardResetModalOpened}
          onClose={this.handleCloseHardResetModal}
          onReject={this.handleCloseHardResetModal}
          onConfirm={this.handleHardReset}
          confirmText={t('app:common.reset')}
          title={t('app:settings.hardResetModal.title')}
          desc={t('app:settings.hardResetModal.desc')}
          renderIcon={this.hardResetIconRender}
        />

        <PasswordModal
          t={t}
          isOpened={isPasswordModalOpened}
          onClose={this.handleClosePasswordModal}
          onChangePassword={this.handleChangePassword}
          isPasswordEnabled={isPasswordEnabled}
          currentPasswordHash={settings.password.value}
        />

        <DisablePasswordModal
          t={t}
          isOpened={isDisablePasswordModalOpened}
          onClose={this.handleCloseDisablePasswordModal}
          onChangePassword={this.handleChangePassword}
          isPasswordEnabled={isPasswordEnabled}
          currentPasswordHash={settings.password.value}
        />
      </Section>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps,
)(TabProfile)

// TODO: need a helper file for common styles across the app
export const IconWrapperCircle = styled(Box).attrs({})`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ea2e4919;
  text-align: -webkit-center;
  justify-content: center;
`
