/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'

import DetailPage from 'devops/containers/Base/Detail'
import { trigger } from 'utils/action'
import CDStore from 'stores/cd'
import { observer, inject } from 'mobx-react'
import { get } from 'lodash'
import { getLocalTime, getDisplayName } from 'utils'
import { toJS, computed } from 'mobx'
import ClusterStore from 'stores/cluster'
import routes from './routes'
import StatusText from '../Components/StatusText'
import Destination from '../Components/Destination'

@inject('rootStore')
@observer
@trigger
export default class CDDetail extends React.Component {
  state = {
    showEdit: false,
    showYamlEdit: false,
    deleteModule: false,
    isLoading: true,
  }

  store = new CDStore()

  clusterStore = new ClusterStore()

  @computed
  get clusters() {
    return this.clusterStore.list.data
  }

  get listUrl() {
    const { workspace, cluster, devops } = this.props.match.params
    return `/${workspace}/clusters/${cluster}/devops/${devops}/cd`
  }

  get devops() {
    return this.props.match.params.devops
  }

  get cluster() {
    return this.props.match.params.cluster
  }

  get routing() {
    return this.props.rootStore.routing
  }

  fetchData = () => {
    const { params } = this.props.match
    this.store.fetchDetail({ name: params.cd, devops: params.devops })
  }

  componentDidMount() {
    this.fetchData()
    this.clusterStore.fetchList({ limit: -1 })
  }

  getOperations = () => [
    {
      key: 'edit',
      type: 'control',
      text: t('EDIT'),
      action: 'edit',
      onClick: () => {
        this.trigger('resource.baseinfo.edit', {
          formTemplate: this.store.detail,
          detail: this.store.detail,
          success: this.fetchData,
        })
      },
    },
    {
      key: 'sync',
      icon: 'changing-over',
      text: t('Synchronize'),
      action: 'edit',
      onClick: () => {
        this.trigger('cd.sync', {
          title: t('Synchronize'),
          formTemplate: toJS(this.store.detail),
          devops: this.devops,
          noCodeEdit: true,
          success: this.fetchData,
        })
      },
    },
    {
      key: 'editYaml',
      icon: 'pen',
      text: t('EDIT_YAML'),
      action: 'edit',
      onClick: () => {
        this.trigger('resource.yaml.edit', {
          detail: this.store.detail,
          success: this.fetchData,
        })
      },
    },
    {
      key: 'delete',
      icon: 'trash',
      text: t('DELETE'),
      action: 'delete',
      onClick: () => {
        this.trigger('resource.delete', {
          type: 'CD',
          detail: this.store.detail,
          success: () => this.routing.push(this.listUrl),
        })
      },
    },
  ]

  getAttrs = () => {
    const { detail } = this.store

    return [
      {
        name: t('HEALTH_STATUS'),
        value: (
          <StatusText
            type={detail.healthStatus}
            label={detail.healthStatus}
            noBolder
          />
        ),
      },
      {
        name: t('DEPLOY_LOCATION'),
        value: (
          <Destination
            destination={detail.destination}
            clustersDetail={this.clusters}
          />
        ),
      },
      {
        name: t('CODE_REPOSITORY_URL'),
        value: get(detail, 'repoSource.repoURL', '-'),
      },
      {
        name: t('REVISE'),
        value: get(detail, 'repoSource.targetRevision', '-'),
      },
      {
        name: t('CODE_RELATIVE_PATH'),
        value: get(detail, 'repoSource.path', '-'),
      },
      {
        name: t('CREATION_TIME_TCAP'),
        value: getLocalTime(detail.createTime).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        name: t('UPDATE_TIME_SCAP'),
        value: getLocalTime(get(detail, 'status.reconciledAt')).format(
          'YYYY-MM-DD HH:mm:ss'
        ),
      },
      {
        name: t('CREATED_BY'),
        value: detail.creator,
      },
    ]
  }

  render() {
    const { detail } = this.store
    const stores = { detailStore: this.store }

    const sideProps = {
      module: 'cds',
      name: getDisplayName(detail),
      desc: detail.description,
      operations: this.getOperations(),
      attrs: this.getAttrs(),
      breadcrumbs: [
        {
          label: t('CD_RESOURCE_PL'),
          url: this.listUrl,
        },
      ],
    }

    return <DetailPage routes={routes} {...sideProps} stores={stores} />
  }
}