{{/*
Expand the name of the chart.
*/}}
{{- define "agi-environment.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "agi-environment.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "agi-environment.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "agi-environment.labels" -}}
helm.sh/chart: {{ include "agi-environment.chart" . }}
{{ include "agi-environment.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: agi-platform
app.kubernetes.io/tier: {{ .Values.app.tier | default "backend" }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "agi-environment.selectorLabels" -}}
app.kubernetes.io/name: {{ include "agi-environment.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .Values.app.name | default "agi-core" }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "agi-environment.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "agi-environment.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the proper image name
*/}}
{{- define "agi-environment.image" -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag }}
{{- end }}

{{/*
Create the name of the secret to use for TLS
*/}}
{{- define "agi-environment.tlsSecretName" -}}
{{- if .Values.ingress.tls }}
{{- (index .Values.ingress.tls 0).secretName | default (printf "%s-tls" (include "agi-environment.fullname" .)) }}
{{- else }}
{{- printf "%s-tls" (include "agi-environment.fullname" .) }}
{{- end }}
{{- end }}
