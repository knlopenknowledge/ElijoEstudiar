pmb_im.controllers.controller('FormCtrl', ['$scope', '$state',
  '$stateParams',
  '$ionicPlatform',
  '$ionicPopup',
  '$ionicModal',
  'LocationsService',
  'ModalService',
  'ApiService',
  'MapService',
  'DBService',
  'ErrorService',
  '$ionicSlideBoxDelegate',
  function($scope, $state, $stateParams, $ionicPlatform, $ionicPopup, $ionicModal, LocationsService, ModalService, ApiService, MapService, DBService, ErrorService, $ionicSlideBoxDelegate) {
    $scope.locLastSearch = '';
    ErrorService.hideError();
    document.getElementById("back_arrow").style.display = "block";
    $scope.$on("$ionicView.loaded", function() {
      $scope.map = MapService.modal_map;
      //// TODO: Cargar datos en caso que sea de editar búsqueda
    });
    $scope.resetTurnos = function() {
      $scope.form.turnos = {
        "matutino":"selected",
        "vespertino":"selected",
        "nocturno":"selected",
        "completo":"selected",
      };
    }
    $scope.resetGroups = function() {
      $scope.shownGroup = {
        "Primaria":false,
        "Secundaria":false,
        "UTU":false,
        "Formación en educación":false
      };
    }
    $scope.resetGroups();
    $scope.restarEdad = function(){
      if(parseInt($scope.form.edad) > 4){
        $scope.form.edad = parseInt($scope.form.edad) - 1;
      }
    };

    $scope.sumarEdad = function(){
      $scope.form.edad = parseInt($scope.form.edad) + 1;
    };

    $scope.select_turno = function(idTurno){
      if ( $scope.form.turnos === undefined ) {
        $scope.resetTurnos();
      }
      if ( $scope.form.turnos[idTurno] == "selected" ) {
        $scope.form.turnos[idTurno] = "unselected";
      }
      else {
        $scope.form.turnos[idTurno] = "selected";
      }
    }

    $scope.onSearchChangeQue = function(id){
      //delete previous selection
      //$scope.form.que = {};
      var search = document.getElementById(id);
      var search_str = search.value.trim();
      if( search_str.length >= 3 ){
        ModalService.activateLoading(id, 'mini');
        ApiService.searchQueEstudiar(search_str, $scope.form.edad).then(function (response) {
          //console.log(response);
          $scope.form[id+'Results'] = response.data;
          $scope.resetGroups();
          document.getElementById(id+"Results").style.display = "block";
          document.getElementById("loading-mini").style.display = "none";
        });
      }else{
        $scope.form[id] = {};
        $scope.hideSearchQueResults(id);
      }
    }

    $scope.hideSearchQueResults = function(id){
      $scope.resetGroups();
      var results = document.getElementById(id+"Results");
      results.style.display = "none";
      //Move back just in case
      document.getElementById("modal-page").style.display="none";
      document.getElementById(id+"Wrapper").appendChild(results);
    }

    $scope.selectQueEstudiarItem = function(curso, id){
      $scope.form[id] = curso;
      $scope.hideSearchQueResults(id);
      $scope.form['search'+id] = curso.nombre;
    }

    $scope.listAllQueEstudiar = function(){
      ModalService.openModal('buscando', 'loading');
      ApiService.searchQueEstudiar("all").then(function (response) {
        $scope.form.queEstudiarResults = response.data;
        ModalService.openModal('full', 'queEstudiarResults');
        document.getElementById("loading").style.display = "none";
      });
    }

    $scope.onSearchChangeDonde = function(){
      //delete previous selection
      $scope.form.donde = {};
      var search = document.getElementById("donde_estudiar");
      var search_str = search.value.trim().toUpperCase();
      if(search_str.length>=3){
        ModalService.activateLoading('donde_estudiar', 'mini');
        //Si no está vacío y no cambió las primeras letras
        if ( $scope.form.SearchDondeResults !== undefined && $scope.form.SearchDondeResults.length > 0 && search_str.includes($scope.locLastSearch) ) {
          //Reverse por problemas de modificación de índices
          for (i = $scope.form.SearchDondeResults.length - 1; i >= 0; --i) {
            if ( !$scope.form.SearchDondeResults[i].nombre.includes(search_str) ) {
              $scope.form.SearchDondeResults.splice(i, 1);
            }
          }
          document.getElementById("loading-mini").style.display = "none";
        }
        else if (!$scope.isActiveSearch){
          $scope.isActiveSearch = 1;
          ApiService.searchDondeEstudiar(search_str).then(function (response) {
            $scope.isActiveSearch = 0;
            $scope.form.SearchDondeResults = response.data;
            document.getElementById("SearchDondeResults").style.display = "block";
            document.getElementById("loading-mini").style.display = "none";
          });
        }
        $scope.locLastSearch = search_str;
      }
      else{
        $scope.isActiveSearch = 0;
        $scope.hideSearchDondeResults();
      }
    }

    $scope.hideSearchDondeResults = function(){
      document.getElementById("SearchDondeResults").style.display = "none";
    }

    $scope.selectDondeEstudiarItem = function(donde){
      $scope.form.donde = donde;
      $scope.hideSearchDondeResults();
      $scope.form.searchDonde = donde.nombre;
    }

	  $scope.next = function() {
      $scope.resetGroups();
      if ( $ionicSlideBoxDelegate.currentIndex() == 1 && ( typeof $scope.form.queEstudiar === 'undefined' || angular.equals($scope.form.queEstudiar, {}) ) ) {
        ErrorService.showError('Por favor, seleccione un curso de la lista.')
      }
      else {
        $ionicSlideBoxDelegate.next();
        ErrorService.hideError();
      }
	  };

	  $scope.previous = function() {
      $scope.resetGroups();
      ErrorService.hideError();
	    $ionicSlideBoxDelegate.previous();
	  };

    $scope.slideHasChanged = function(index){
      if(index==2){
        ApiService.filters = $scope.form
        var params = ApiService.createFilterParamsForGetRequest();
        $state.go( "app.search_cursos_result", params );
      }
    }
    $scope.openModal = function(style, content) {
      ModalService.openModal(style, content);
      if ( style == "modal-map") {
        MapService.goToPlace("ubicacion_map", "Confirmar", $scope);
      }
    }
    /**
    * Función para cerrar modal de ubicación
    */
    $scope.ubicacion = function(longlat){
      document.getElementById("donde_estudiar").value = "Ubicado en mapa"
      $scope.form.donde = {
        "departamento": "NA",
        "nombre": "Ubicado en mapa",
        "lat": longlat[0],
        "long": longlat[1]
      };
      document.getElementById("modal-page").style.display="none";
      document.getElementById("SearchDondeResults").style.display = "none";
    }
    $scope.toggleGroup = function(group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup[group] = false;
      } else {
        $scope.shownGroup[group] = true;
      }
    };
    $scope.isGroupShown = function(group) {
      return $scope.shownGroup[group];
    };

    if ( ApiService.filters != null ) {
      $scope.form = ApiService.filters;
      //Inputs
      if ( ApiService.filters.queEstudie ) {
        $scope.form.searchqueEstudie = ApiService.filters.queEstudie.nombre;
      }
      if ( ApiService.filters.donde ) {
        $scope.form.searchDonde = ApiService.filters.donde.nombre;
      }
      $scope.form.searchqueEstudiar = ApiService.filters.queEstudiar.nombre;
    }
    else {
      $scope.form = {};
      $scope.form.edad = 0;
      $scope.form.plan = "";
      //$scope.form.lugar = "";
      $scope.form.depto = "";
      $scope.form.localidad = "";
      $scope.form.que = {};
      $scope.form.donde = {};
      $scope.resetTurnos();
      $scope.form.SearchQueEstudieResults = {};
      $scope.form.SearchQueResults = {};
      $scope.form.SearchDondeResults = [];
    }

  }
]);
