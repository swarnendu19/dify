'use client'
import type { FC } from 'react'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import {
  RiDatabase2Line,
  RiFileExcel2Line,
  RiGitCommitLine,
  RiNewspaperLine,
  RiPresentationLine,
  RiRoadMapLine,
  RiTerminalBoxLine,
  RiTranslate,
  RiUser2Line,
} from '@remixicon/react'
import cn from 'classnames'
import s from './style.module.css'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import Textarea from '@/app/components/base/textarea'
import Toast from '@/app/components/base/toast'
import { generateRule } from '@/service/debug'
import ConfigPrompt from '@/app/components/app/configuration/config-prompt'
import type { CompletionParams, Model } from '@/types/app'
import { AppType } from '@/types/app'
import ConfigVar from '@/app/components/app/configuration/config-var'
import GroupName from '@/app/components/app/configuration/base/group-name'
import Loading from '@/app/components/base/loading'
import Confirm from '@/app/components/base/confirm'
import { LoveMessage } from '@/app/components/base/icons/src/vender/features'

// type
import type { AutomaticRes } from '@/service/debug'
import { Generator } from '@/app/components/base/icons/src/vender/other'
import ModelParameterModal from '@/app/components/header/account-setting/model-provider-page/model-parameter-modal'

import { ModelTypeEnum } from '@/app/components/header/account-setting/model-provider-page/declarations'
import { useModelListAndDefaultModelAndCurrentProviderAndModel } from '@/app/components/header/account-setting/model-provider-page/hooks'
import type { ModelModeType } from '@/types/app'
import type { FormValue } from '@/app/components/header/account-setting/model-provider-page/declarations'

export type IGetAutomaticResProps = {
  mode: AppType
  isShow: boolean
  onClose: () => void
  onFinished: (res: AutomaticRes) => void
  isInLLMNode?: boolean
}

const TryLabel: FC<{
  Icon: any
  text: string
  onClick: () => void
}> = ({ Icon, text, onClick }) => {
  return (
    <div
      className='mr-1 mt-2 flex h-7 shrink-0 cursor-pointer items-center rounded-lg bg-components-button-secondary-bg px-2'
      onClick={onClick}
    >
      <Icon className='h-4 w-4 text-text-tertiary'></Icon>
      <div className='ml-1 text-xs font-medium text-text-secondary'>{text}</div>
    </div>
  )
}

const GetAutomaticRes: FC<IGetAutomaticResProps> = ({
  mode,
  isShow,
  onClose,
  isInLLMNode,
  onFinished,
}) => {
  const { t } = useTranslation()
  const localModel = localStorage.getItem('auto-gen-model')
    ? JSON.parse(localStorage.getItem('auto-gen-model') as string) as Model
    : null
  const [model, setModel] = React.useState<Model>(localModel || {
    name: '',
    provider: '',
    mode: mode as unknown as ModelModeType.chat,
    completion_params: {} as CompletionParams,
  })
  const {
    defaultModel,
  } = useModelListAndDefaultModelAndCurrentProviderAndModel(ModelTypeEnum.textGeneration)
  const tryList = [
    {
      icon: RiTerminalBoxLine,
      key: 'pythonDebugger',
    },
    {
      icon: RiTranslate,
      key: 'translation',
    },
    {
      icon: RiPresentationLine,
      key: 'meetingTakeaways',
    },
    {
      icon: RiNewspaperLine,
      key: 'writingsPolisher',
    },
    {
      icon: RiUser2Line,
      key: 'professionalAnalyst',
    },
    {
      icon: RiFileExcel2Line,
      key: 'excelFormulaExpert',
    },
    {
      icon: RiRoadMapLine,
      key: 'travelPlanning',
    },
    {
      icon: RiDatabase2Line,
      key: 'SQLSorcerer',
    },
    {
      icon: RiGitCommitLine,
      key: 'GitGud',
    },
  ]

  const [instruction, setInstruction] = useState<string>('')
  const handleChooseTemplate = useCallback((key: string) => {
    return () => {
      const template = t(`appDebug.generate.template.${key}.instruction`)
      setInstruction(template)
    }
  }, [t])
  const isValid = () => {
    if (instruction.trim() === '') {
      Toast.notify({
        type: 'error',
        message: t('common.errorMsg.fieldRequired', {
          field: t('appDebug.generate.instruction'),
        }),
      })
      return false
    }
    return true
  }
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false)
  const [res, setRes] = useState<AutomaticRes | null>(null)

  useEffect(() => {
    if (defaultModel) {
      const localModel = localStorage.getItem('auto-gen-model')
        ? JSON.parse(localStorage.getItem('auto-gen-model') || '')
        : null
      if (localModel) {
        setModel(localModel)
      }
      else {
        setModel(prev => ({
          ...prev,
          name: defaultModel.model,
          provider: defaultModel.provider.provider,
        }))
      }
    }
  }, [defaultModel])

  const renderLoading = (
    <div className='flex h-full w-0 grow flex-col items-center justify-center space-y-3'>
      <Loading />
      <div className='text-[13px] text-text-tertiary'>{t('appDebug.generate.loading')}</div>
    </div>
  )

  const renderNoData = (
    <div className='flex h-full w-0 grow flex-col items-center justify-center space-y-3 px-8'>
      <Generator className='h-14 w-14 text-text-tertiary' />
      <div className='text-center text-[13px] font-normal leading-5 text-text-tertiary'>
        <div>{t('appDebug.generate.noDataLine1')}</div>
        <div>{t('appDebug.generate.noDataLine2')}</div>
      </div>
    </div>
  )

  const handleModelChange = useCallback((newValue: { modelId: string; provider: string; mode?: string; features?: string[] }) => {
    const newModel = {
      ...model,
      provider: newValue.provider,
      name: newValue.modelId,
      mode: newValue.mode as ModelModeType,
    }
    setModel(newModel)
    localStorage.setItem('auto-gen-model', JSON.stringify(newModel))
  }, [model, setModel])

  const handleCompletionParamsChange = useCallback((newParams: FormValue) => {
    const newModel = {
      ...model,
      completion_params: newParams as CompletionParams,
    }
    setModel(newModel)
    localStorage.setItem('auto-gen-model', JSON.stringify(newModel))
  }, [model, setModel])

  const onGenerate = async () => {
    if (!isValid())
      return
    if (isLoading)
      return
    setLoadingTrue()
    try {
      const { error, ...res } = await generateRule({
        instruction,
        model_config: model,
        no_variable: !!isInLLMNode,
      })
      setRes(res)
      if (error) {
        Toast.notify({
          type: 'error',
          message: error,
        })
      }
    }
    finally {
      setLoadingFalse()
    }
  }

  const [showConfirmOverwrite, setShowConfirmOverwrite] = React.useState(false)

  const isShowAutoPromptResPlaceholder = () => {
    return !isLoading && !res
  }

  return (
    <Modal
      isShow={isShow}
      onClose={onClose}
      className='min-w-[1140px] !p-0'
      closable
    >
      <div className='flex h-[680px] flex-wrap'>
        <div className='h-full w-[570px] shrink-0 overflow-y-auto border-r border-divider-regular p-6'>
          <div className='mb-8'>
            <div className={`text-lg font-bold leading-[28px] ${s.textGradient}`}>{t('appDebug.generate.title')}</div>
            <div className='mt-1 text-[13px] font-normal text-text-tertiary'>{t('appDebug.generate.description')}</div>
          </div>
          <div className='mb-8'>
            <ModelParameterModal
              popupClassName='!w-[520px]'
              portalToFollowElemContentClassName='z-[1000]'
              isAdvancedMode={true}
              provider={model.provider}
              mode={model.mode}
              completionParams={model.completion_params}
              modelId={model.name}
              setModel={handleModelChange}
              onCompletionParamsChange={handleCompletionParamsChange}
              hideDebugWithMultipleModel
            />
          </div>
          <div >
            <div className='flex items-center'>
              <div className='mr-3 shrink-0 text-xs font-semibold uppercase leading-[18px] text-text-tertiary'>{t('appDebug.generate.tryIt')}</div>
              <div className='h-px grow' style={{
                background: 'linear-gradient(to right, rgba(243, 244, 246, 1), rgba(243, 244, 246, 0))',
              }}></div>
            </div>
            <div className='flex flex-wrap'>
              {tryList.map(item => (
                <TryLabel
                  key={item.key}
                  Icon={item.icon}
                  text={t(`appDebug.generate.template.${item.key}.name`)}
                  onClick={handleChooseTemplate(item.key)}
                />
              ))}
            </div>
          </div>
          {/* inputs */}
          <div className='mt-6'>
            <div className='text-[0px]'>
              <div className='mb-2 text-sm font-medium leading-5 text-text-primary'>{t('appDebug.generate.instruction')}</div>
              <Textarea
                className="h-[200px] resize-none"
                placeholder={t('appDebug.generate.instructionPlaceHolder') as string}
                value={instruction}
                onChange={e => setInstruction(e.target.value)} />
            </div>

            <div className='mt-5 flex justify-end'>
              <Button
                className='flex space-x-1'
                variant='primary'
                onClick={onGenerate}
                disabled={isLoading}
              >
                <Generator className='h-4 w-4 text-white' />
                <span className='text-xs font-semibold text-white'>{t('appDebug.generate.generate')}</span>
              </Button>
            </div>
          </div>
        </div>

        {(!isLoading && res) && (
          <div className='h-full w-0 grow p-6 pb-0'>
            <div className='mb-3 shrink-0 text-base font-semibold leading-[160%] text-text-secondary'>{t('appDebug.generate.resTitle')}</div>
            <div className={cn('max-h-[555px] overflow-y-auto', !isInLLMNode && 'pb-2')}>
              <ConfigPrompt
                mode={mode}
                promptTemplate={res?.prompt || ''}
                promptVariables={[]}
                readonly
                noTitle={isInLLMNode}
                gradientBorder
                editorHeight={isInLLMNode ? 524 : 0}
                noResize={isInLLMNode}
              />
              {!isInLLMNode && (
                <>
                  {(res?.variables?.length && res?.variables?.length > 0)
                    ? (
                      <ConfigVar
                        promptVariables={res?.variables.map(key => ({ key, name: key, type: 'string', required: true })) || []}
                        readonly
                      />
                    )
                    : ''}

                  {(mode !== AppType.completion && res?.opening_statement) && (
                    <div className='mt-7'>
                      <GroupName name={t('appDebug.feature.groupChat.title')} />
                      <div
                        className='mb-1 rounded-xl border-l-[0.5px] border-t-[0.5px] border-effects-highlight bg-background-section-burn p-3'
                      >
                        <div className='mb-2 flex items-center gap-2'>
                          <div className='shrink-0 rounded-lg border-[0.5px] border-divider-subtle bg-util-colors-blue-light-blue-light-500 p-1 shadow-xs'>
                            <LoveMessage className='h-4 w-4 text-text-primary-on-surface' />
                          </div>
                          <div className='system-sm-semibold flex grow items-center text-text-secondary'>
                            {t('appDebug.feature.conversationOpener.title')}
                          </div>
                        </div>
                        <div className='system-xs-regular min-h-8 text-text-tertiary'>{res.opening_statement}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className='flex justify-end bg-background-default py-4'>
              <Button onClick={onClose}>{t('common.operation.cancel')}</Button>
              <Button variant='primary' className='ml-2' onClick={() => {
                setShowConfirmOverwrite(true)
              }}>{t('appDebug.generate.apply')}</Button>
            </div>
          </div>
        )}
        {isLoading && renderLoading}
        {isShowAutoPromptResPlaceholder() && renderNoData}
        {showConfirmOverwrite && (
          <Confirm
            title={t('appDebug.generate.overwriteTitle')}
            content={t('appDebug.generate.overwriteMessage')}
            isShow={showConfirmOverwrite}
            onConfirm={() => {
              setShowConfirmOverwrite(false)
              onFinished(res!)
            }}
            onCancel={() => setShowConfirmOverwrite(false)}
          />
        )}
      </div>
    </Modal>
  )
}
export default React.memo(GetAutomaticRes)
