#!/usr/bin/env python

"""
achilles.py -- Server-side Python App Engine API;
    uses Google Cloud Endpoints

"""

__author__ = 'ra1stringer+api@google.com (RA Stringer)'


from datetime import datetime

import endpoints
from protorpc import messages
from protorpc import message_types
from protorpc import remote

from google.appengine.ext import ndb

from models import Profile
from models import ProfileMiniForm
from models import ProfileForm
from models import TeeShirtSize
from models import Student
from models import StudentForm

from settings import WEB_CLIENT_ID

from utils import getUserId

EMAIL_SCOPE = endpoints.EMAIL_SCOPE
API_EXPLORER_CLIENT_ID = endpoints.API_EXPLORER_CLIENT_ID

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

DEFAULTS = {
    "school": "Default School",
    "grade": 0,
    "miles": 0
}


@endpoints.api( name='achilles',
                version='v1',
                allowed_client_ids=[WEB_CLIENT_ID, API_EXPLORER_CLIENT_ID],
                scopes=[EMAIL_SCOPE])
class AchillesApi(remote.Service):
    """Achilles API v0.1"""


# - - - Student objects - - - - - - - - - - - - - - - - - - -

    def _copyStudentToForm(self, student, displayName):
        """Copy relevant fields from Student to StudentForm"""
        sf = StudentForm()
        for field in sf.all_fields():
            if hasattr(student, field.name):
                setattr(sf, field.name, getattr(student, field.name))
            if field.name == "websafeKey":
                setattr(sf, field.name, student.key.urlsafe())
        # try without:
        # if displayName:
        #     setattr(sf, 'organizerDisplayName', displayName)
        sf.check_initialized()
        return sf

    def _createStudentObject(self, request):
        """Create or update Student object, returning StudentForm/request"""
        user = endpoints.get_current_user()
        if not user:
            raise endpoints.UnauthorizedException('Authorization required')
        user_id = getUserId(user)

        if not request.name:
            raise endpoints.BadRequestException("Student 'name' field required")

        # copy StudentForm/ProtoRPC Message into dictionary
        data = {field.name: getattr(request, field.name) for field in request.all_fields()}
        del data['websafeKey']

        # add default values for those missing
        for df in DEFAULTS:
            if data[df] in (None, []):
                data[df] = DEFAULTS[df]
                setattr(request, df, DEFAULTS[df])

        # make Profile Key from user ID
        p_key = ndb.Key(Profile, user_id)
        # allocate new Student ID with Profile key as parent
        s_id = Student.allocate_ids(size=1, parent=p_key)[0]
        #make Student key from ID
        s_id = ndb.Key(Student, s_id, parent=p_key)
        data['key'] = s_key

        # add Student profile and return modified StudentForm
        Student(**data).put()

        return(request)

    @endpoints.method(StudentForm, StudentForm, path='student', http_method='POST', name='createStudent')
    def createStudent(self, request):
        """Create new student."""
        return self._createStudentObject(request)




# - - - Profile objects - - - - - - - - - - - - - - - - - - -

    def _copyProfileToForm(self, prof):
        """Copy relevant fields from Profile to ProfileForm."""
        # copy relevant fields from Profile to ProfileForm
        pf = ProfileForm()
        for field in pf.all_fields():
            if hasattr(prof, field.name):
                # convert t-shirt string to Enum; just copy others
                if field.name == 'teeShirtSize':
                    setattr(pf, field.name, getattr(TeeShirtSize, getattr(prof, field.name)))
                else:
                    setattr(pf, field.name, getattr(prof, field.name))
        pf.check_initialized()
        return pf


    def _getProfileFromUser(self):
        """Return user Profile from datastore, creating new one if non-existent."""
        user = endpoints.get_current_user()
        if not user:
            raise endpoints.UnauthorizedException('Authorization required')

        # get Profile from datastore
        user_id = getUserId(user)
        p_key = ndb.Key(Profile, user_id)

        # get entity from datastore by using get() on the key
        profile = p_key.get()

        # create a new profile if not found
        if not profile:
            profile = Profile(
                key = None, # TODO 1 step 4. replace with the key from step 3
                displayName = user.nickname(),
                mainEmail= user.email(),
                teeShirtSize = str(TeeShirtSize.NOT_SPECIFIED),
            )
        profile.put()

        return profile      # return Profile


    def _doProfile(self, save_request=None):
        """Get user Profile and return to user, possibly updating it first."""
        # get user Profile
        prof = self._getProfileFromUser()

        # if saveProfile(), process user-modifyable fields
        if save_request:
            for field in ('displayName', 'teeShirtSize'):
                if hasattr(save_request, field):
                    val = getattr(save_request, field)
                    if val:
                        setattr(prof, field, str(val))

            # put the modified profile to datastore
            prof.put()

        # return ProfileForm
        return self._copyProfileToForm(prof)


    @endpoints.method(message_types.VoidMessage, ProfileForm,
            path='profile', http_method='GET', name='getProfile')
    def getProfile(self, request):
        """Return user profile."""
        return self._doProfile()


    @endpoints.method(ProfileMiniForm, ProfileForm,
            path='profile', http_method='POST', name='saveProfile')
    def saveProfile(self, request):
        """Update & return user profile."""
        return self._doProfile(request)


# registers API
api = endpoints.api_server([AchillesApi])
