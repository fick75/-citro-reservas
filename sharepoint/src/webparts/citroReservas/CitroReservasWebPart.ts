import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import CitroReservasApp, { ICitroReservasAppProps } from './components/CitroReservasApp';

export interface ICitroReservasWebPartProps {
  titulo: string;
  mostrarCalendario: boolean;
}

export default class CitroReservasWebPart extends BaseClientSideWebPart<ICitroReservasWebPartProps> {

  private _isDarkTheme: boolean = false;

  public render(): void {
    const element: React.ReactElement<ICitroReservasAppProps> = React.createElement(
      CitroReservasApp,
      {
        titulo: this.properties.titulo || 'CITRO Reservas',
        mostrarCalendario: this.properties.mostrarCalendario,
        spHttpClient: this.context.spHttpClient,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        currentUserEmail: this.context.pageContext.user.email,
        currentUserDisplayName: this.context.pageContext.user.displayName,
        isDarkTheme: this._isDarkTheme,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) return;
    this._isDarkTheme = !!currentTheme.isInverted;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configuración de CITRO Reservas' },
          groups: [
            {
              groupName: 'Apariencia',
              groupFields: [
                PropertyPaneTextField('titulo', {
                  label: 'Título del web part',
                  value: this.properties.titulo || 'CITRO Reservas',
                }),
                PropertyPaneToggle('mostrarCalendario', {
                  label: 'Mostrar vista de calendario',
                  onText: 'Sí',
                  offText: 'No',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
